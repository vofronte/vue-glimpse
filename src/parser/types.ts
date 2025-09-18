import type { BindingTypes } from '@vue/compiler-dom'
import type { Range } from 'vscode'

/**
 * Defines the canonical list of identifier categories.
 * This union type is the single source of truth, ensuring type safety
 * and preventing magic strings throughout the application.
 */
export type IdentifierCategoryKey
  = | 'props'
    | 'localState'
    | 'ref'
    | 'reactive'
    | 'computed'
    | 'methods'
    | 'store'
    | 'emits'
    | 'passthrough'

/**
 * Holds detailed information about a script identifier.
 * This structure is designed to be extensible for future features.
 */
export interface ScriptIdentifierDetails {
  /**
   * The full source code text of the statement that defines the identifier.
   * e.g., "const count = ref(0)"
   */
  definition: string
}

/**
 * A mapped type that generates properties for decoration ranges, one for each category.
 * e.g., { propsRanges: Range[], refRanges: Range[], ... }
 * This avoids manual repetition and ensures consistency with IdentifierCategoryKey.
 */
type DecorationRanges = {
  [K in IdentifierCategoryKey as `${K}Ranges`]: Range[]
}

/**
 * A record mapping each identifier category to its collection of identifiers.
 * This provides a structured, type-safe way to store and access script metadata.
 */
export type ScriptIdentifiers = Record<IdentifierCategoryKey, Map<string, ScriptIdentifierDetails>>

/**
 * The unified result of a full Vue component analysis.
 * This refined structure separates decoration data from script metadata,
 * adhering to the Single Responsibility Principle. It serves as the single
 * source of truth for all consumer features (e.g., decorations, hovers).
 */
export interface AnalysisResult extends DecorationRanges {
  /**
   * Detailed information about all script identifiers, primarily
   * used by features like hover providers.
   */
  scriptIdentifiers: ScriptIdentifiers
}

/**
 * A simplified version of BindingMetadata from @vue/compiler-core.
 * It's a map of identifier names to their binding types.
 */
export type BindingMetadata = Record<string, BindingTypes | undefined>
