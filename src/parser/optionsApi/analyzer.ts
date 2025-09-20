import type { ArrayExpression, ObjectExpression, ObjectMethod, ObjectProperty, VariableDeclarator } from '@babel/types'
import type { SFCDescriptor } from '@vue/compiler-sfc'
import type { IdentifierCategoryKey } from '../../parser/types.js'
import type { AnalysisResult, BindingMetadata, ScriptIdentifiers } from '../types.js'
import type { ImportAnalysis } from '../utils/importAnalyzer.js'
import { parse as babelParse } from '@babel/parser'
import { BindingTypes } from '@vue/compiler-dom'
import { log } from '../../utils/logger.js'
import { createEmptyAnalysisResult } from '../index.js'
import { analyzeTemplate } from '../templateAnalyzer.js'
import { analyzeImports } from '../utils/importAnalyzer.js'
import { analyzeVueImports, findComponentDefinition, findSetupMethod, getNodeKeyName } from './helpers.js'
import { analyzeBindingsFromOptions } from './vendor/analyzeScriptBindings.js'

/**
 * Analyzes a binding from setup() to determine its specific reactivity type.
 * Only handles the simple case: `const myVar = ref(...)`.
 * @param name The name of the binding to analyze.
 * @param setupMethodAst The AST node of the setup() method.
 * @returns A specific IdentifierCategoryKey or null if uncertain.
 */
function analyzeSetupBinding(
  name: string,
  setupMethodAst: ObjectMethod,
  importMap: Map<string, string>,
): IdentifierCategoryKey | null {
  let declarator: VariableDeclarator | undefined

  // 1. Find the variable declaration in the setup() body
  for (const node of setupMethodAst.body.body) {
    if (node.type === 'VariableDeclaration') {
      const decl = node.declarations.find(
        d => d.id.type === 'Identifier' && d.id.name === name,
      )
      if (decl) {
        declarator = decl
        break
      }
    }
  }

  if (!declarator || !declarator.init) {
    // No declaration or no initializer, we can't be sure.
    return null
  }

  const init = declarator.init

  // Case 1: Reactivity APIs
  if (init.type === 'CallExpression' && init.callee.type === 'Identifier') {
    const calleeName = init.callee.name
    const originalName = importMap.get(calleeName) || calleeName

    switch (originalName) {
      case 'ref': return 'ref'
      case 'reactive': return 'reactive'
      case 'computed': return 'computed'
    }
  }

  // Case 2: Simple literal constants
  if (
    init.type === 'NumericLiteral'
    || init.type === 'StringLiteral'
    || init.type === 'BooleanLiteral'
    || init.type === 'NullLiteral'
    || init.type === 'ArrayExpression'
    || init.type === 'ObjectExpression'
  ) {
    return 'localState'
  }

  // Case 3: Arrow function or function expression (treat as a method)
  if (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression') {
    return 'methods'
  }

  // We are not sure about other cases (e.g., complex expressions, reassignment)
  return null
}

function convertMetadataToIdentifiers(metadata: BindingMetadata, setupMethodAst: ObjectMethod | undefined, importMap: Map<string, string>): ScriptIdentifiers {
  const identifiers: ScriptIdentifiers = {
    props: new Map(),
    reactive: new Map(),
    ref: new Map(),
    computed: new Map(),
    methods: new Map(),
    store: new Map(),
    pinia: new Map(),
    vuex: new Map(),
    emits: new Map(),
    passthrough: new Map(),
    localState: new Map(),
  }

  for (const [name, type] of Object.entries(metadata)) {
    if (name === '__isScriptSetup')
      continue

    const details = { definition: `Defined in component options` }
    switch (type) {
      case BindingTypes.PROPS:
        identifiers.props.set(name, details); break
      case BindingTypes.DATA:
        identifiers.reactive.set(name, details); break
      case BindingTypes.SETUP_MAYBE_REF:
      case BindingTypes.SETUP_REF:
        if (setupMethodAst) {
          const refinedCategory = analyzeSetupBinding(name, setupMethodAst, importMap)
          if (refinedCategory) {
            // We are 100% sure, so we classify it.
            identifiers[refinedCategory].set(name, details)
            continue
          }
          // If refinedCategory is null, we do NOTHING. No icon will be shown.
        }
        break
      case BindingTypes.OPTIONS:
        identifiers.localState.set(name, details); break
    }
  }

  return identifiers
}

/**
 * Refines the analysis by differentiating computed, methods, and store helpers.
 * @param componentDef The component's ObjectExpression AST node.
 * @param identifiers The ScriptIdentifiers object to refine.
 * @param importAnalysis Results of the import analysis.
 */
function detailAnalysis(componentDef: ObjectExpression, identifiers: ScriptIdentifiers, importAnalysis: ImportAnalysis) {
  const properties = componentDef.properties.filter(
    (prop): prop is ObjectProperty => prop.type === 'ObjectProperty',
  )

  for (const prop of properties) {
    const key = getNodeKeyName(prop.key)

    if (key === 'computed' && prop.value.type === 'ObjectExpression') {
      for (const computedNode of prop.value.properties) {
        // Handle `myComputed() { ... }` and `myComputed: ...`
        if (computedNode.type === 'ObjectProperty' || computedNode.type === 'ObjectMethod') {
          const name = getNodeKeyName(computedNode.key)
          if (name && identifiers.localState.has(name)) {
            const details = identifiers.localState.get(name)!
            identifiers.localState.delete(name)
            identifiers.computed.set(name, details)
          }
        }
        // Handle `...mapState(...)`
        else if (computedNode.type === 'SpreadElement' && computedNode.argument.type === 'CallExpression') {
          const call = computedNode.argument
          // We must be surgically precise. We check the NAME of the function being called.
          if (call.callee.type !== 'Identifier')
            continue // Skip complex cases like `stores.mapState()` for now to be safe.

          const calleeName = call.callee.name
          let targetCategory: 'pinia' | 'vuex' | 'store' = 'store' // Default to generic 'store'

          // Check if the called function's name exists in the set of names imported from 'pinia'.
          if (importAnalysis.piniaImportNames.has(calleeName))
            targetCategory = 'pinia'
          // Else, check if it was imported from 'vuex'.
          else if (importAnalysis.vuexImportNames.has(calleeName))
            targetCategory = 'vuex'
          const arrayArg = call.arguments.find(
            (arg): arg is ArrayExpression => arg.type === 'ArrayExpression',
          )

          if (arrayArg) {
            for (const el of arrayArg.elements) {
              if (el?.type === 'StringLiteral') {
                const name = el.value
                if (!identifiers[targetCategory].has(name)) {
                  // The log message will now correctly reflect the source.
                  log(`[Options API] Found ${targetCategory} binding from spread: ${name}`)
                  identifiers[targetCategory].set(name, { definition: 'From store helper' })
                }
              }
            }
          }
        }
      }
    }
    else if (key === 'methods' && prop.value.type === 'ObjectExpression') {
      for (const methodNode of prop.value.properties) {
        if (methodNode.type === 'ObjectProperty' || methodNode.type === 'ObjectMethod') {
          const name = getNodeKeyName(methodNode.key)
          if (name && identifiers.localState.has(name)) {
            const details = identifiers.localState.get(name)!
            identifiers.localState.delete(name)
            identifiers.methods.set(name, details)
          }
        }
        // ...mapActions(...) ---
        else if (methodNode.type === 'SpreadElement' && methodNode.argument.type === 'CallExpression') {
          const call = methodNode.argument
          // This logic is similar and should also be robust. Let's apply the same fix.
          const arrayArg = call.arguments.find(
            (arg): arg is ArrayExpression => arg.type === 'ArrayExpression',
          )

          if (arrayArg) {
            for (const el of arrayArg.elements) {
              if (el?.type === 'StringLiteral') {
                const name = el.value
                // Actions from store helpers are methods.
                if (!identifiers.methods.has(name)) {
                  log(`[Options API] Found method binding from spread: ${name}`)
                  identifiers.methods.set(name, { definition: 'From actions helper' })
                }
              }
            }
          }
        }
      }
    }
  }
}

/**
 * Orchestrates the analysis of a Vue component using the Options API.
 * @param descriptor The SFC descriptor.
 * @returns A comprehensive analysis result. Throws an error on failure.
 */
export function analyzeOptionsApi(
  descriptor: SFCDescriptor,
): AnalysisResult {
  log('[Options API] Analyzer invoked.')
  if (!descriptor.script)
    return createEmptyAnalysisResult()

  try {
    const scriptAst = babelParse(descriptor.script.content, {
      sourceType: 'module',
      plugins: ['typescript'],
    }).program

    const componentDef = findComponentDefinition(scriptAst)
    if (!componentDef) {
      log('[Options API] Component definition not found.')
      return createEmptyAnalysisResult()
    }

    // Find the setup method AST node
    const setupMethodAst = findSetupMethod(componentDef)
    const importMap = analyzeVueImports(scriptAst)

    // --- Analyze imports for store context ---
    const importAnalysis = analyzeImports(scriptAst)
    log('[Options API] Import analysis result:', importAnalysis)

    const bindingMetadata = analyzeBindingsFromOptions(componentDef)
    log('[Options API] Base bindings found:', bindingMetadata)

    const scriptIdentifiers = convertMetadataToIdentifiers(bindingMetadata, setupMethodAst, importMap)

    // --- Perform detailed analysis ---
    detailAnalysis(componentDef, scriptIdentifiers, importAnalysis)

    log('[Options API] Detailed analysis complete:', {
      props: [...scriptIdentifiers.props.keys()],
      reactive: [...scriptIdentifiers.reactive.keys()],
      computed: [...scriptIdentifiers.computed.keys()],
      methods: [...scriptIdentifiers.methods.keys()],
      store: [...scriptIdentifiers.store.keys()],
      pinia: [...scriptIdentifiers.pinia.keys()],
      vuex: [...scriptIdentifiers.vuex.keys()],
      localState: [...scriptIdentifiers.localState.keys()],
    })

    if (descriptor.template?.ast) {
      const templateAnalysis = analyzeTemplate(descriptor, scriptIdentifiers)
      return { ...templateAnalysis, scriptIdentifiers }
    }

    return { ...createEmptyAnalysisResult(), scriptIdentifiers }
  }
  catch (error) {
    log('[Options API] Failed to parse script:', error)
    // Propagate the error to be handled by AnalysisManager
    throw error
  }
}
