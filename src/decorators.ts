import type { TextEditorDecorationType } from 'vscode'
import { ThemeColor, window } from 'vscode'

/**
 * Creates a text editor decoration type with a specified icon and color.
 * @param icon The icon to display after the text.
 * @param colorId The theme color ID to use for the icon.
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

/** Decoration for component props. */
export const propDecorationType = createDecoration('℗', 'gitDecoration.modifiedResourceForeground')
/** Decoration for local state variables. */
export const localStateDecorationType = createDecoration('•', 'editorHint.foreground')
/** Decoration for Vue refs. */
export const refDecorationType = createDecoration('🔹', 'gitDecoration.renamedResourceForeground')
/** Decoration for Vue reactive objects. */
export const reactiveDecorationType = createDecoration('🔷', 'gitDecoration.renamedResourceForeground')
/** Decoration for Vue computed properties. */
export const computedDecorationType = createDecoration('⚡', 'gitDecoration.renamedResourceForeground')
/** Decoration for component methods. */
export const methodDecorationType = createDecoration('ƒ', 'gitDecoration.untrackedResourceForeground')
/** Decoration for store-related properties (e.g., Vuex, Pinia). */
export const storeDecorationType = createDecoration('📦', 'gitDecoration.conflictingResourceForeground')
/** Decoration for component emits. */
export const emitDecorationType = createDecoration('📤', 'gitDecoration.addedResourceForeground')
