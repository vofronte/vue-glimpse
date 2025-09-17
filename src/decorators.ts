import type { TextEditorDecorationType } from 'vscode'
import type { IdentifierCategoryKey } from './parser/types.js'
import { ThemeColor, window } from 'vscode'
import { CATEGORY_ICONS } from './categoryConfig.js'

/**
 * A private factory function to create a single decoration type.
 * @param icon The icon character to display.
 * @param colorId The theme color ID.
 * @returns A TextEditorDecorationType instance.
 */
function createDecoration(icon: string, colorId: string): TextEditorDecorationType {
  return window.createTextEditorDecorationType({
    after: {
      contentText: icon,
      margin: '0 0 0 1.5px',
      color: new ThemeColor(colorId),
    },
  })
}

// A map of categories to their theme color IDs.
const DECORATION_COLORS: Record<IdentifierCategoryKey, string> = {
  props: 'gitDecoration.modifiedResourceForeground',
  localState: 'editorHint.foreground',
  ref: 'gitDecoration.renamedResourceForeground',
  reactive: 'gitDecoration.renamedResourceForeground',
  computed: 'gitDecoration.renamedResourceForeground',
  methods: 'gitDecoration.untrackedResourceForeground',
  store: 'gitDecoration.conflictingResourceForeground',
  emits: 'gitDecoration.addedResourceForeground',
  passthrough: 'gitDecoration.ignoredResourceForeground',
}

/**
 * A programmatically generated map of all decoration types.
 * This is the single exported object from this module.
 * It is created by mapping over our single source of truth for icons.
 */
export const DECORATIONS = (Object.keys(CATEGORY_ICONS) as IdentifierCategoryKey[]).reduce((acc, key) => {
  acc[key] = createDecoration(CATEGORY_ICONS[key], DECORATION_COLORS[key])
  return acc
}, {} as Record<IdentifierCategoryKey, TextEditorDecorationType>)
