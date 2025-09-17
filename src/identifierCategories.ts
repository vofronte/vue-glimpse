import type { TextEditorDecorationType } from 'vscode'
import type { AnalysisResult, IdentifierCategoryKey, ScriptIdentifiers } from './parser/types.js'
import { CATEGORY_ICONS, CATEGORY_LABELS, CATEGORY_PRIORITY } from './categoryConfig.js'
import { DECORATIONS } from './decorators.js'

/**
 * Defines the relationship between an identifier category, its decoration,
 * and its corresponding properties in the analysis result.
 */
export interface IdentifierCategory {
  key: IdentifierCategoryKey
  decoration: TextEditorDecorationType
  icon: string
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

// Step 3: Generate the final configuration array programmatically.
// This is the single source of truth, derived from the data above.
export const IDENTIFIER_CATEGORIES: IdentifierCategory[] = CATEGORY_PRIORITY.map(key => ({
  key,
  decoration: DECORATIONS[key],
  icon: CATEGORY_ICONS[key],
  label: CATEGORY_LABELS[key],
  scriptProperty: key,
  resultProperty: `${key}Ranges`,
}))
