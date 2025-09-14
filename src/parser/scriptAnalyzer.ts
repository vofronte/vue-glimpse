import type { SFCScriptBlock } from '@vue/compiler-sfc'
import type { Node as TSNode } from 'typescript'
import type { ScriptIdentifiers } from './types.js'
import { BindingTypes } from '@vue/compiler-dom'
import {
  createSourceFile,
  forEachChild,
  isArrowFunction,
  isCallExpression,
  isFunctionDeclaration,
  isFunctionExpression,
  isIdentifier,
  isObjectBindingPattern,
  isVariableDeclaration,
  isVariableStatement,
  ScriptTarget,
} from 'typescript'
import { log } from '../utils/logger.js'

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
  const identifiers: ScriptIdentifiers = {
    props: new Set(),
    localState: new Set(),
    ref: new Set(),
    reactive: new Set(),
    computed: new Set(),
    methods: new Set(),
    store: new Set(),
    emits: new Set(),
  }

  if (!scriptBlock.bindings) {
    log('No binding metadata found in script block.')
    return identifiers
  }

  // --- Lightweight AST Pass on ORIGINAL Source ---
  // We parse the original content because macros like defineEmits are removed
  // by compileScript. This is the only reliable way to find them.
  const sourceFile = createSourceFile('component.ts', originalContent, ScriptTarget.Latest, true)
  const methods = new Set<string>()
  const computeds = new Set<string>()
  const stores = new Set<string>()
  const emits = new Set<string>()

  function astWalk(node: TSNode) {
    if (isCallExpression(node) && isIdentifier(node.expression)) {
      const callName = node.expression.text
      log(`[VueGlimpse][AST Walk] Found call expression: ${callName}`)

      switch (callName) {
        case 'defineEmits': {
          if (node.parent && isVariableDeclaration(node.parent) && isIdentifier(node.parent.name)) {
            const varName = node.parent.name.text
            emits.add(varName)
            log(`[VueGlimpse][AST Walk] Found 'defineEmits' assigned to variable: ${varName}`)
          }
          else {
            emits.add('emit')
            log(`[VueGlimpse][AST Walk] Found standalone 'defineEmits' call. Assuming implicit 'emit'.`)
          }
          break
        }
        case 'computed': {
          if (node.parent && isVariableDeclaration(node.parent) && isIdentifier(node.parent.name)) {
            computeds.add(node.parent.name.text)
          }
          break
        }
        case 'storeToRefs': {
          if (node.parent && isVariableDeclaration(node.parent) && isObjectBindingPattern(node.parent.name)) {
            for (const element of node.parent.name.elements) {
              if (isIdentifier(element.name)) {
                stores.add(element.name.text)
              }
            }
          }
          break
        }
        default: {
          if (/^use[A-Z].*Store$/.test(callName)) {
            if (node.parent && isVariableDeclaration(node.parent) && isIdentifier(node.parent.name)) {
              stores.add(node.parent.name.text)
            }
          }
          break
        }
      }
    }

    if (isFunctionDeclaration(node) && node.name) {
      methods.add(node.name.text)
    }
    else if (isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (isIdentifier(decl.name) && decl.initializer && (isArrowFunction(decl.initializer) || isFunctionExpression(decl.initializer))) {
          methods.add(decl.name.text)
        }
      }
    }

    forEachChild(node, astWalk)
  }

  astWalk(sourceFile)

  // --- Manually add special identifiers found by AST Walk ---
  // The implicit 'emit' is not in `bindings`, so we add it directly.
  // For others (stores, computeds), this ensures they have the highest priority.
  emits.forEach(e => identifiers.emits.add(e))
  stores.forEach(s => identifiers.store.add(s))
  computeds.forEach(c => identifiers.computed.add(c))

  // --- Process Bindings from Compiler ---
  // This remains our primary source of truth for general binding types.
  for (const [name, type] of Object.entries(scriptBlock.bindings)) {
    if (typeof type !== 'string') {
      continue
    }

    // If already categorized by our more specific AST pass, skip.
    if (identifiers.emits.has(name) || identifiers.store.has(name) || identifiers.computed.has(name)) {
      continue
    }

    switch (type as unknown as BindingTypes) {
      case BindingTypes.PROPS:
        identifiers.props.add(name)
        break

      case BindingTypes.SETUP_REF:
        // This includes ref(), shallowRef(), etc.
        // We've already handled computed() specifically, so this is for regular refs.
        identifiers.ref.add(name)
        break

      case BindingTypes.SETUP_REACTIVE_CONST:
        // This is for reactive().
        identifiers.reactive.add(name)
        break

      case BindingTypes.SETUP_CONST:
        // Check if it's a function we identified.
        if (methods.has(name)) {
          identifiers.methods.add(name)
        }
        else {
          identifiers.localState.add(name)
        }
        break

      case BindingTypes.SETUP_MAYBE_REF:
      case BindingTypes.SETUP_LET:
      case BindingTypes.LITERAL_CONST:
        identifiers.localState.add(name)
        break
    }
  }

  return identifiers
}
