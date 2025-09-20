import type { IdentifierCategoryKey } from './parser/types.js'

/**
 * THE SINGLE SOURCE OF TRUTH for default icons.
 */
export const DEFAULT_CATEGORY_ICONS: Record<IdentifierCategoryKey, string> = {
  props: '℗',
  passthrough: '📥',
  emits: '📤',
  ref: '🔹',
  reactive: '🔷',
  computed: '⚡',
  store: '📦',
  pinia: '🍍',
  vuex: '📦',
  methods: 'ƒ',
  localState: '•',
}

/**
 * THE SINGLE SOURCE OF TRUTH for default colors.
 * Values are either a VS Code Theme Color ID or a HEX/RGB string.
 */
export const DEFAULT_CATEGORY_COLORS: Record<IdentifierCategoryKey, string> = {
  props: 'gitDecoration.modifiedResourceForeground',
  passthrough: 'gitDecoration.ignoredResourceForeground',
  emits: 'gitDecoration.addedResourceForeground',
  ref: 'gitDecoration.renamedResourceForeground',
  reactive: 'gitDecoration.renamedResourceForeground',
  computed: 'gitDecoration.renamedResourceForeground',
  store: 'gitDecoration.conflictingResourceForeground',
  pinia: 'gitDecoration.conflictingResourceForeground',
  vuex: 'gitDecoration.conflictingResourceForeground',
  methods: 'gitDecoration.untrackedResourceForeground',
  localState: 'editorHint.foreground',
}

/**
 * A pure function that generates the final icon map. Decoupled from vscode API for testability.
 *
 * @param defaults The default icon map.
 * @param overrides The user-defined overrides.
 * @returns A complete mapping of category keys to their final icon strings.
 */
export function generateIconMap(
  defaults: Record<IdentifierCategoryKey, string>,
  overrides: Record<string, string>,
): Record<IdentifierCategoryKey, string> {
  const finalMap = { ...defaults }
  for (const key in overrides) {
    if (Object.prototype.hasOwnProperty.call(finalMap, key))
      finalMap[key as IdentifierCategoryKey] = overrides[key]
  }
  return finalMap
}

/**
 * A pure function that generates the final color map. Decoupled from vscode API for testability.
 *
 * @param defaults The default color map.
 * @param overrides The user-defined overrides.
 * @returns A complete mapping of category keys to their final color strings.
 */
export function generateColorMap(
  defaults: Record<IdentifierCategoryKey, string>,
  overrides: Record<string, string>,
): Record<IdentifierCategoryKey, string> {
  // Logic is identical to generateIconMap, adhering to DRY.
  return generateIconMap(defaults, overrides)
}

/**
 * THE SINGLE SOURCE OF TRUTH for human-readable labels.
 */
export const CATEGORY_LABELS: Record<IdentifierCategoryKey, string> = {
  props: 'Prop',
  passthrough: 'Passthrough',
  emits: 'Emit',
  ref: 'Ref',
  reactive: 'Reactive',
  computed: 'Computed Property',
  store: 'Store State',
  pinia: 'Pinia State',
  vuex: 'Vuex State',
  methods: 'Method',
  localState: 'Local Variable',
}

/**
 * THE SINGLE SOURCE OF TRUTH for analysis priority.
 */
export const CATEGORY_PRIORITY: IdentifierCategoryKey[] = [
  'emits',
  'passthrough',
  'props',
  'pinia',
  'vuex',
  'store',
  'computed',
  'ref',
  'reactive',
  'methods',
  'localState',
]
