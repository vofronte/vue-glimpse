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
  isVariableStatement,
  ScriptTarget,
} from 'typescript'
import { log } from '../utils/logger.js'

/**
 * Analyzes the binding metadata from `compileScript` and enhances it with
 * a lightweight AST pass to distinguish methods, stores, and computeds.
 *
 * @param scriptBlock The compiled <script setup> block from @vue/compiler-sfc.
 * @returns An object containing sets of identified variable names.
 */
export function analyzeScript(scriptBlock: SFCScriptBlock): ScriptIdentifiers {
  const identifiers: ScriptIdentifiers = {
    props: new Set(),
    localState: new Set(),
    ref: new Set(),
    reactive: new Set(),
    computed: new Set(),
    methods: new Set(),
    store: new Set(),
  }

  if (!scriptBlock.bindings) {
    log('No binding metadata found in script block.')
    return identifiers
  }

  // --- Lightweight AST Pass for Specifics ---
  // The compiler gives us general types (e.g., SETUP_CONST), but we need to know
  // if a const is a function, a computed property, or a store reference.
  const sourceFile = createSourceFile('component.ts', scriptBlock.content, ScriptTarget.Latest, true)
  const methods = new Set<string>()
  const computeds = new Set<string>()
  const stores = new Set<string>()

  function astWalk(node: TSNode) {
    if (isFunctionDeclaration(node) && node.name) {
      methods.add(node.name.text)
    }
    else if (isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        // Handle simple `const/let name = ...`
        if (isIdentifier(decl.name)) {
          const varName = decl.name.text
          if (decl.initializer) {
            if (isArrowFunction(decl.initializer) || isFunctionExpression(decl.initializer)) {
              methods.add(varName)
            }
            else if (isCallExpression(decl.initializer) && isIdentifier(decl.initializer.expression)) {
              const callName = decl.initializer.expression.text
              if (callName === 'computed') {
                computeds.add(varName)
              }
              else if (/^use[A-Z].*Store$/.test(callName)) {
                stores.add(varName)
              }
            }
          }
        }
        // Handle `const { a, b } = storeToRefs(...)`
        else if (isObjectBindingPattern(decl.name) && decl.initializer
          && isCallExpression(decl.initializer) && isIdentifier(decl.initializer.expression)
          && decl.initializer.expression.text === 'storeToRefs') {
          for (const element of decl.name.elements) {
            if (isIdentifier(element.name)) {
              stores.add(element.name.text)
            }
          }
        }
      }
    }
    forEachChild(node, astWalk)
  }
  astWalk(sourceFile)

  // --- Process Bindings from Compiler ---
  // This is our primary source of truth.
  for (const [name, type] of Object.entries(scriptBlock.bindings)) {
    // Ensure we work only with real binding types (strings),
    // not meta-properties like `__isScriptSetup` (boolean).
    if (typeof type !== 'string') {
      continue
    }

    // Highest priority: check our specific sets first.
    if (stores.has(name)) {
      identifiers.store.add(name)
      continue
    }
    if (computeds.has(name)) {
      identifiers.computed.add(name)
      continue
    }

    // --- Use double type assertion ---
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

        // These are all considered local state for our purposes.
      case BindingTypes.SETUP_MAYBE_REF:
      case BindingTypes.SETUP_LET:
      case BindingTypes.LITERAL_CONST:
        identifiers.localState.add(name)
        break
    }
  }

  return identifiers
}
