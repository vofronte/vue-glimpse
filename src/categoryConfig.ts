import type { IdentifierCategoryKey } from './parser/types.js'

/**
 * THE SINGLE SOURCE OF TRUTH for icons.
 */
export const CATEGORY_ICONS: Record<IdentifierCategoryKey, string> = {
  props: '℗',
  passthrough: '📥',
  emits: '📤',
  ref: '🔹',
  reactive: '🔷',
  computed: '⚡',
  store: '📦',
  methods: 'ƒ',
  localState: '•',
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
  'store',
  'computed',
  'ref',
  'reactive',
  'methods',
  'localState',
]
