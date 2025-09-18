import type {
  ExportDefaultDeclaration,
  Identifier,
  Node,
  ObjectExpression,
  ObjectProperty,
  Program,
} from '@babel/types'
import type { SFCDescriptor } from '@vue/compiler-sfc'
import type { TextDocument } from 'vscode'
import type { AnalysisResult, BindingMetadata, ScriptIdentifiers } from '../types.js'
import { parse as babelParse } from '@babel/parser'
import { BindingTypes } from '@vue/compiler-dom'
import { log } from '../../utils/logger.js'
import { createEmptyAnalysisResult } from '../index.js'
import { analyzeTemplate } from '../templateAnalyzer.js'
import { analyzeBindingsFromOptions } from './vendor/analyzeScriptBindings.js'

/**
 * Safely gets the string name of a property key from an AST node.
 * @param node The key node (Identifier or StringLiteral).
 * @returns The name of the key or undefined if it's a complex expression.
 */
function getNodeKeyName(node: Node): string | undefined {
  if (node.type === 'Identifier')
    return node.name
  if (node.type === 'StringLiteral')
    return node.value
}

function findComponentDefinition(scriptAst: Program): ObjectExpression | null {
  const exportDefault = scriptAst.body.find(
    node => node.type === 'ExportDefaultDeclaration',
  ) as ExportDefaultDeclaration | undefined

  if (!exportDefault)
    return null

  if (exportDefault.declaration.type === 'ObjectExpression')
    return exportDefault.declaration

  if (
    exportDefault.declaration.type === 'CallExpression'
    && (exportDefault.declaration.callee as Identifier).name === 'defineComponent'
    && exportDefault.declaration.arguments[0]?.type === 'ObjectExpression'
  ) {
    return exportDefault.declaration.arguments[0]
  }

  return null
}

function convertMetadataToIdentifiers(metadata: BindingMetadata): ScriptIdentifiers {
  const identifiers: ScriptIdentifiers = {
    props: new Map(),
    reactive: new Map(),
    ref: new Map(),
    computed: new Map(),
    methods: new Map(),
    store: new Map(),
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
        identifiers.props.set(name, details)
        break
      case BindingTypes.DATA:
        identifiers.reactive.set(name, details)
        break
      case BindingTypes.SETUP_MAYBE_REF:
      case BindingTypes.SETUP_REF:
        identifiers.ref.set(name, details)
        break
      case BindingTypes.OPTIONS:
        identifiers.localState.set(name, details)
        break
    }
  }

  return identifiers
}

/**
 * Refines the analysis by differentiating computed properties and methods.
 * @param componentDef The component's ObjectExpression AST node.
 * @param identifiers The ScriptIdentifiers object to refine.
 */
function detailAnalysis(componentDef: ObjectExpression, identifiers: ScriptIdentifiers) {
  const componentProperties = componentDef.properties.filter(
    (prop): prop is ObjectProperty => prop.type === 'ObjectProperty',
  )

  for (const prop of componentProperties) {
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
          // Heuristic: Check for array as the second argument, e.g., mapState(store, ['theme', 'role'])
          if (call.arguments[1]?.type === 'ArrayExpression') {
            for (const el of call.arguments[1].elements) {
              if (el?.type === 'StringLiteral') {
                const name = el.value
                // **THE FIX**: Directly add to store, don't check localState
                if (!identifiers.store.has(name)) {
                  log(`[Options API] Found store binding from spread: ${name}`)
                  identifiers.store.set(name, { definition: 'From store helper' })
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
      }
    }
  }
}

/**
 * Orchestrates the analysis of a Vue component using the Options API.
 * @param descriptor The SFC descriptor.
 * @param document The VS Code text document.
 * @returns A comprehensive analysis result or null on failure.
 */
export function analyzeOptionsApi(
  descriptor: SFCDescriptor,
  document: TextDocument,
): AnalysisResult | null {
  // ... (остальная часть функции не меняется)
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

    const bindingMetadata = analyzeBindingsFromOptions(componentDef)
    log('[Options API] Base bindings found:', bindingMetadata)

    const scriptIdentifiers = convertMetadataToIdentifiers(bindingMetadata)

    // --- Perform detailed analysis ---
    detailAnalysis(componentDef, scriptIdentifiers)

    log('[Options API] Detailed analysis complete:', {
      props: [...scriptIdentifiers.props.keys()],
      reactive: [...scriptIdentifiers.reactive.keys()],
      computed: [...scriptIdentifiers.computed.keys()],
      methods: [...scriptIdentifiers.methods.keys()],
      store: [...scriptIdentifiers.store.keys()],
    })

    if (descriptor.template?.ast) {
      const templateAnalysis = analyzeTemplate(descriptor, scriptIdentifiers, document)
      return { ...templateAnalysis, scriptIdentifiers }
    }

    return { ...createEmptyAnalysisResult(), scriptIdentifiers }
  }
  catch (error) {
    log('[Options API] Failed to parse script:', error)
    return null
  }
}
