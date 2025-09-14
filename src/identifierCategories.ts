import type { TextEditorDecorationType } from 'vscode'
import type { AnalysisResult, ScriptIdentifiers } from './parser/types.js'
import {
  computedDecorationType,
  emitDecorationType,
  localStateDecorationType,
  methodDecorationType,
  passthroughDecorationType,
  propDecorationType,
  reactiveDecorationType,
  refDecorationType,
  storeDecorationType,
} from './decorators.js'

export interface IdentifierCategory {
  /**
   * The key can now be any key from ScriptIdentifiers, including 'localState'.
   */
  key: keyof ScriptIdentifiers
  decoration: TextEditorDecorationType
  scriptProperty: keyof ScriptIdentifiers
  resultProperty: keyof AnalysisResult
}

/**
 * A map of built-in Vue identifiers found in templates to their corresponding result property.
 * This helps keep the template analyzer DRY.
 */
export const VUE_BUILTIN_HANDLERS = new Map<string, keyof AnalysisResult>([
  ['$emit', 'emitRanges'],
  ['$attrs', 'passthroughRanges'],
  ['$slots', 'passthroughRanges'],
])

export const IDENTIFIER_CATEGORIES: IdentifierCategory[] = [
  // Highest priority first
  {
    key: 'emits',
    decoration: emitDecorationType,
    scriptProperty: 'emits',
    resultProperty: 'emitRanges',
  },
  {
    key: 'passthrough',
    decoration: passthroughDecorationType,
    scriptProperty: 'passthrough',
    resultProperty: 'passthroughRanges',
  },
  {
    key: 'props',
    decoration: propDecorationType,
    scriptProperty: 'props',
    resultProperty: 'propRanges',
  },
  {
    key: 'store',
    decoration: storeDecorationType,
    scriptProperty: 'store',
    resultProperty: 'storeRanges',
  },
  {
    key: 'computed',
    decoration: computedDecorationType,
    scriptProperty: 'computed',
    resultProperty: 'computedRanges',
  },
  {
    key: 'ref',
    decoration: refDecorationType,
    scriptProperty: 'ref',
    resultProperty: 'refRanges',
  },
  {
    key: 'reactive',
    decoration: reactiveDecorationType,
    scriptProperty: 'reactive',
    resultProperty: 'reactiveRanges',
  },
  {
    key: 'methods',
    decoration: methodDecorationType,
    scriptProperty: 'methods',
    resultProperty: 'methodRanges',
  },
  // localState is the fallback, but we include it for completeness in decoration clearing
  {
    key: 'localState',
    decoration: localStateDecorationType,
    scriptProperty: 'localState',
    resultProperty: 'localStateRanges',
  },
]
