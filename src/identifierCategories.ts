import type { TextEditorDecorationType } from 'vscode'
import type { AnalysisResult, IdentifierCategoryKey, ScriptIdentifiers } from './parser/types.js'
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

/**
 * Defines the relationship between an identifier category, its decoration,
 * and its corresponding properties in the analysis result.
 */
export interface IdentifierCategory {
  key: IdentifierCategoryKey
  decoration: TextEditorDecorationType
  scriptProperty: keyof ScriptIdentifiers
  resultProperty: keyof Omit<AnalysisResult, 'scriptIdentifiers'>
}

/**
 * A map of built-in Vue identifiers found in templates to their corresponding result property.
 * This helps keep the template analyzer DRY.
 */
export const VUE_BUILTIN_HANDLERS = new Map<string, keyof Omit<AnalysisResult, 'scriptIdentifiers'>>([
  ['$emit', 'emitsRanges'],
  ['$attrs', 'passthroughRanges'],
  ['$slots', 'passthroughRanges'],
])

// Step 1: Declarative map of categories to their unique decoration.
const CATEGORY_DECORATIONS: Record<IdentifierCategoryKey, TextEditorDecorationType> = {
  emits: emitDecorationType,
  passthrough: passthroughDecorationType,
  props: propDecorationType,
  store: storeDecorationType,
  computed: computedDecorationType,
  ref: refDecorationType,
  reactive: reactiveDecorationType,
  methods: methodDecorationType,
  localState: localStateDecorationType,
}

// Step 2: An explicit array defining the priority order for analysis.
const CATEGORY_PRIORITY: IdentifierCategoryKey[] = [
  'emits',
  'passthrough',
  'props',
  'store',
  'computed',
  'ref',
  'reactive',
  'methods',
  'localState', // Fallback, so it's last.
]

// Step 3: Generate the final configuration array programmatically.
// This is the single source of truth, derived from the data above.
export const IDENTIFIER_CATEGORIES: IdentifierCategory[] = CATEGORY_PRIORITY.map(key => ({
  key,
  decoration: CATEGORY_DECORATIONS[key],
  scriptProperty: key,
  resultProperty: `${key}Ranges`,
}))
