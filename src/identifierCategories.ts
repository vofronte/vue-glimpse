import type { AnalysisResult, IdentifierCategoryKey, ScriptIdentifiers } from './parser/types.js'
import { CATEGORY_LABELS, CATEGORY_PRIORITY } from './categoryConfig.js'

/**
 * Defines the relationship between an identifier category and its corresponding
 * properties in the analysis result. This is a "view model" for our categories,
 * independent of VS Code APIs and visual representation.
 */
export interface IdentifierCategory {
  key: IdentifierCategoryKey
  label: string
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

// This is the single source of truth for category definitions,
// derived from the base configuration data.
export const IDENTIFIER_CATEGORIES: IdentifierCategory[] = CATEGORY_PRIORITY.map(key => ({
  key,
  label: CATEGORY_LABELS[key],
  scriptProperty: key,
  resultProperty: `${key}Ranges`,
}))
