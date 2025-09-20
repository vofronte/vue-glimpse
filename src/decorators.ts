import type { IdentifierCategoryKey } from './parser/types.js'

// A map of categories to their theme color IDs.
export const DECORATION_CONFIG: Record<IdentifierCategoryKey, { color: string }> = {
  props: { color: 'gitDecoration.modifiedResourceForeground' },
  localState: { color: 'editorHint.foreground' },
  ref: { color: 'gitDecoration.renamedResourceForeground' },
  reactive: { color: 'gitDecoration.renamedResourceForeground' },
  computed: { color: 'gitDecoration.renamedResourceForeground' },
  methods: { color: 'gitDecoration.untrackedResourceForeground' },
  store: { color: 'gitDecoration.conflictingResourceForeground' },
  pinia: { color: 'gitDecoration.conflictingResourceForeground' },
  vuex: { color: 'gitDecoration.conflictingResourceForeground' },
  emits: { color: 'gitDecoration.addedResourceForeground' },
  passthrough: { color: 'gitDecoration.ignoredResourceForeground' },
}
