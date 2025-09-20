import type { SFCScriptBlock } from '@vue/compiler-sfc'
import type { Node as TSNode } from 'typescript'
import type { ScriptIdentifierDetails, ScriptIdentifiers } from '../types.js'
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
import { log } from '../../utils/logger.js'
import { analyzeImports } from '../utils/importAnalyzer.js'

/**
 * A helper function to get the full text of the statement a node belongs to.
 * e.g., for `count` in `const count = ref(0)`, it returns "const count = ref(0)".
 */
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

/**
 * Creates a new, empty ScriptIdentifiers object, ensuring all category maps are initialized.
 */
function createEmptyScriptIdentifiers(): ScriptIdentifiers {
  return {
    props: new Map(),
    localState: new Map(),
    ref: new Map(),
    reactive: new Map(),
    computed: new Map(),
    methods: new Map(),
    store: new Map(),
    pinia: new Map(),
    vuex: new Map(),
    emits: new Map(),
    passthrough: new Map(),
  }
}

/**
 * Analyzes the binding metadata from `@vue/compiler-sfc` and enhances it with
 * a lightweight AST pass on the original source to distinguish methods,
 * stores, computeds, and emits with higher precision.
 *
 * @param scriptBlock The compiled <script setup> block from @vue/compiler-sfc.
 * @param originalContent The original, unmodified content of the <script setup> block.
 * @returns An object containing maps of all identified variables by category.
 */
export function analyzeScript(scriptBlock: SFCScriptBlock, originalContent: string): ScriptIdentifiers {
  const identifiers = createEmptyScriptIdentifiers()
  const bindings = scriptBlock.bindings || {}
  const sourceFile = createSourceFile('component.ts', originalContent, ScriptTarget.Latest, true)
  const processedNames = new Set<string>()

  // Step 1: Analyze all imports first to get context about state management libraries.
  // This is crucial for making accurate decisions later.
  const importAnalysis = analyzeImports(sourceFile)
  log('[Script Setup] Import analysis result:', importAnalysis)

  /**
   * Categorizes an identifier based on its binding type from the Vue compiler.
   * This is our baseline classification.
   */
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
        if (details.definition.includes('defineProps'))
          identifiers.props.set(name, { definition: 'const props = defineProps(...)' })
        else
          identifiers.reactive.set(name, details)
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

  /**
   * Walks the TypeScript AST to find patterns that the Vue compiler doesn't distinguish,
   * such as store helpers, methods, and specific macros.
   */
  function astWalk(node: TSNode) {
    // We are primarily interested in top-level variable declarations.
    if (isVariableStatement(node)) {
      const fullStatementText = getFullStatementText(node, sourceFile)
      for (const decl of node.declarationList.declarations) {
        let handled = false
        // We only care about variables initialized with a function call, e.g., `const x = func()`.
        if (decl.initializer && isCallExpression(decl.initializer) && isIdentifier(decl.initializer.expression)) {
          const callName = decl.initializer.expression.text
          const details = { definition: fullStatementText }

          // Case 1: The variable is a simple identifier, e.g., `const myStore = useMyStore()`.
          if (isIdentifier(decl.name)) {
            const varName = decl.name.text
            switch (callName) {
              case 'defineEmits': identifiers.emits.set(varName, details); handled = true; break
              case 'useAttrs': case 'useSlots': identifiers.passthrough.set(varName, details); handled = true; break
              case 'computed': identifiers.computed.set(varName, details); handled = true; break
              default:
                // ---
                // We cannot reliably know the origin of a `use...Store` function without
                // parsing its source file, which is out of scope and slow.
                // A `use...Store` could come from a local file that uses Pinia,
                // or it could be a custom composition function.
                // To avoid false positives (our #1 principle), we classify ALL such
                // patterns as the generic 'store'. The only exception is if a helper
                // like `storeToRefs` is explicitly imported from Pinia.
                // ---
                if (/^use[A-Z].*Store$/.test(callName)) {
                  // This is the definitive logic. We trust explicit imports only.
                  let targetCategory: 'pinia' | 'vuex' | 'store' = 'store' // Default to generic

                  // If the `use...Store` function ITSELF was imported from pinia, it's Pinia.
                  if (importAnalysis.piniaImportNames.has(callName))
                    targetCategory = 'pinia'
                  // If it was imported from vuex, it's Vuex.
                  else if (importAnalysis.vuexImportNames.has(callName))
                    targetCategory = 'vuex'

                  // Otherwise, it remains a generic 'store', which is the safe default.
                  identifiers[targetCategory].set(varName, details)
                  handled = true
                }
            }
            if (handled)
              processedNames.add(varName)
          }
          // Case 2: The variable is a destructuring assignment, e.g., `const { user } = storeToRefs(...)`.
          else if (isObjectBindingPattern(decl.name) && callName === 'storeToRefs') {
            // ---
            // This is our single, reliable anchor for identifying a state management library.
            // ---
            let targetCategory: 'pinia' | 'vuex' | 'store' = 'store' // Default to generic
            if (importAnalysis.piniaImportNames.has('storeToRefs'))
              targetCategory = 'pinia'
            else if (importAnalysis.vuexImportNames.has('storeToRefs')) // For vuex-composition-helpers etc.
              targetCategory = 'vuex'

            for (const element of decl.name.elements) {
              if (isIdentifier(element.name)) {
                identifiers[targetCategory].set(element.name.text, details)
                processedNames.add(element.name.text)
              }
            }
            handled = true
          }
        }

        // If the variable was not a special macro or store, handle it as a standard variable.
        if (!handled && isIdentifier(decl.name)) {
          const name = decl.name.text
          const details = { definition: fullStatementText }
          // If it's initialized with a function, it's a method.
          if (decl.initializer && (decl.initializer.kind === SyntaxKind.ArrowFunction || decl.initializer.kind === SyntaxKind.FunctionExpression)) {
            identifiers.methods.set(name, details)
            processedNames.add(name)
          }
          else {
            // Otherwise, fall back to the Vue compiler's classification.
            categorize(name, bindings[name], details)
          }
        }
      }
    }
    // Handle `function myMethod() {}` declarations.
    else if (isFunctionDeclaration(node) && node.name) {
      const name = node.name.text
      if (!processedNames.has(name)) {
        identifiers.methods.set(name, { definition: getFullStatementText(node, sourceFile) })
        processedNames.add(name)
      }
    }
    // Handle standalone `defineEmits()` call without assignment.
    else if (isCallExpression(node) && isIdentifier(node.expression) && node.expression.text === 'defineEmits' && !isVariableDeclaration(node.parent)) {
      if (!processedNames.has('emit')) {
        identifiers.emits.set('emit', { definition: 'const emit = defineEmits(...)' })
        processedNames.add('emit')
      }
    }

    forEachChild(node, astWalk)
  }

  // Start the analysis.
  astWalk(sourceFile)

  // Final sweep: The Vue compiler sometimes reports props that are not declared in `const props = ...`.
  // We need to catch them here.
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
    pinia: [...identifiers.pinia.keys()],
    vuex: [...identifiers.vuex.keys()],
    emits: [...identifiers.emits.keys()],
    passthrough: [...identifiers.passthrough.keys()],
    localState: [...identifiers.localState.keys()],
  })

  return identifiers
}
