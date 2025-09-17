import type { SFCScriptBlock } from '@vue/compiler-sfc'
import type { Node as TSNode } from 'typescript'
import type { ScriptIdentifierDetails, ScriptIdentifiers } from './types.js'
import { BindingTypes } from '@vue/compiler-dom'
import {
  createSourceFile,
  forEachChild,
  isCallExpression,
  isFunctionDeclaration,
  isIdentifier,
  isObjectBindingPattern,
  isVariableDeclaration,
  isVariableStatement,
  ScriptTarget,
  SyntaxKind,
} from 'typescript'
import { log } from '../utils/logger.js'

function getFullStatementText(node: TSNode, sourceFile: import('typescript').SourceFile): string {
  let statementNode = node
  while (statementNode.parent) {
    if (isVariableStatement(statementNode) || isFunctionDeclaration(statementNode)) {
      return statementNode.getText(sourceFile).trim()
    }
    statementNode = statementNode.parent
  }
  return node.getText(sourceFile).trim()
}

function createEmptyScriptIdentifiers(): ScriptIdentifiers {
  return {
    props: new Map(),
    localState: new Map(),
    ref: new Map(),
    reactive: new Map(),
    computed: new Map(),
    methods: new Map(),
    store: new Map(),
    emits: new Map(),
    passthrough: new Map(),
  }
}

/**
 * Analyzes the binding metadata from `compileScript` and enhances it with
 * a lightweight AST pass on the original source to distinguish methods,
 * stores, computeds, and emits.
 *
 * @param scriptBlock The compiled <script setup> block from @vue/compiler-sfc.
 * @param originalContent The original, unmodified content of the <script setup> block.
 * @returns An object containing sets of identified variable names.
 */
export function analyzeScript(scriptBlock: SFCScriptBlock, originalContent: string): ScriptIdentifiers {
  const identifiers = createEmptyScriptIdentifiers()
  const bindings = scriptBlock.bindings || {}

  // --- Lightweight AST Pass on ORIGINAL Source ---
  // We parse the original content because macros like defineEmits are removed
  // by compileScript. This is the only reliable way to find them.
  const sourceFile = createSourceFile('component.ts', originalContent, ScriptTarget.Latest, true)
  const processedNames = new Set<string>()

  function categorize(name: string, bindingType: BindingTypes | undefined, details: ScriptIdentifierDetails) {
    if (processedNames.has(name))
      return

    switch (bindingType) {
      case BindingTypes.PROPS:
      case BindingTypes.PROPS_ALIASED:
        identifiers.props.set(name, details); break
      case BindingTypes.SETUP_REF:
      case BindingTypes.SETUP_MAYBE_REF:
        identifiers.ref.set(name, details); break
      case BindingTypes.SETUP_REACTIVE_CONST:
        if (details.definition.includes('defineProps')) {
          identifiers.props.set(name, { definition: 'const props = defineProps(...)' })
        }
        else {
          identifiers.reactive.set(name, details)
        }
        break
      case BindingTypes.SETUP_CONST:
      case BindingTypes.SETUP_LET:
      case BindingTypes.LITERAL_CONST:
        identifiers.localState.set(name, details); break
      default:
        identifiers.localState.set(name, details)
        break
    }
    processedNames.add(name)
  }

  function astWalk(node: TSNode) {
    if (isVariableStatement(node)) {
      const fullStatementText = getFullStatementText(node, sourceFile)
      for (const decl of node.declarationList.declarations) {
        let handled = false
        // Check for high-priority macros inside the declaration
        if (decl.initializer && isCallExpression(decl.initializer) && isIdentifier(decl.initializer.expression)) {
          const callName = decl.initializer.expression.text
          const details = { definition: fullStatementText }

          if (isIdentifier(decl.name)) {
            const varName = decl.name.text
            switch (callName) {
              case 'defineEmits': identifiers.emits.set(varName, details); handled = true; break
              case 'useAttrs': case 'useSlots': identifiers.passthrough.set(varName, details); handled = true; break
              case 'computed': identifiers.computed.set(varName, details); handled = true; break
              default:
                if (/^use[A-Z].*Store$/.test(callName)) {
                  identifiers.store.set(varName, details); handled = true
                }
            }
            if (handled)
              processedNames.add(varName)
          }
          else if (isObjectBindingPattern(decl.name) && callName === 'storeToRefs') {
            for (const element of decl.name.elements) {
              if (isIdentifier(element.name)) {
                identifiers.store.set(element.name.text, details)
                processedNames.add(element.name.text)
              }
            }
            handled = true
          }
        }

        // If not a special macro, handle as a generic variable
        if (!handled && isIdentifier(decl.name)) {
          const name = decl.name.text
          const details = { definition: fullStatementText }
          if (decl.initializer && (decl.initializer.kind === SyntaxKind.ArrowFunction || decl.initializer.kind === SyntaxKind.FunctionExpression)) {
            identifiers.methods.set(name, details)
            processedNames.add(name)
          }
          else {
            categorize(name, bindings[name], details)
          }
        }
      }
    }
    else if (isFunctionDeclaration(node) && node.name) {
      const name = node.name.text
      if (!processedNames.has(name)) {
        identifiers.methods.set(name, { definition: getFullStatementText(node, sourceFile) })
        processedNames.add(name)
      }
    }
    else if (isCallExpression(node) && isIdentifier(node.expression) && node.expression.text === 'defineEmits' && !isVariableDeclaration(node.parent)) {
      // Standalone defineEmits()
      if (!processedNames.has('emit')) {
        identifiers.emits.set('emit', { definition: 'const emit = defineEmits(...)' })
        processedNames.add('emit')
      }
    }

    forEachChild(node, astWalk)
  }

  astWalk(sourceFile)

  // Final sweep for props not declared via `const props = ...`
  for (const [name, type] of Object.entries(bindings)) {
    if (type === BindingTypes.PROPS && !processedNames.has(name)) {
      identifiers.props.set(name, { definition: `prop: ${name}` })
      processedNames.add(name)
    }
  }

  log('Final analysis result:', {
    props: [...identifiers.props.keys()],
    ref: [...identifiers.ref.keys()],
    reactive: [...identifiers.reactive.keys()],
    computed: [...identifiers.computed.keys()],
    methods: [...identifiers.methods.keys()],
    store: [...identifiers.store.keys()],
    emits: [...identifiers.emits.keys()],
    passthrough: [...identifiers.passthrough.keys()],
    localState: [...identifiers.localState.keys()],
  })

  return identifiers
}
