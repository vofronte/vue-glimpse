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
  // Start with a copy of the defaults
  const finalIcons = { ...defaults }

  // Apply user overrides
  for (const key in overrides) {
    if (Object.prototype.hasOwnProperty.call(finalIcons, key))
      finalIcons[key as IdentifierCategoryKey] = overrides[key]
  }

  return finalIcons
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
