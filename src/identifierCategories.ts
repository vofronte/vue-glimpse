import type { TextEditorDecorationType } from 'vscode'
import type { AnalysisResult, ScriptIdentifiers } from './parser/types.js'
import {
  computedDecorationType,
  emitDecorationType,
  localStateDecorationType,
  methodDecorationType,
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

export const IDENTIFIER_CATEGORIES: IdentifierCategory[] = [
  // Highest priority first
  {
    key: 'emits',
    decoration: emitDecorationType,
    scriptProperty: 'emits',
    resultProperty: 'emitRanges',
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
