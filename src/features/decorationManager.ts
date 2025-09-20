import type { TextEditor, TextEditorDecorationType } from 'vscode'
import type { AnalysisResult, IdentifierCategoryKey } from '../parser/types.js'
import { Range, ThemeColor, window } from 'vscode'
import { getColorMap, getIconMap } from '../configManager.js'
import { IDENTIFIER_CATEGORIES } from '../identifierCategories.js'
import { log } from '../utils/logger.js'

/**
 * Manages the entire lifecycle of VS Code decorations for the extension.
 * This class is responsible for creating, applying, clearing, and disposing
 * of TextEditorDecorationType instances.
 */
export class DecorationManager {
  private decorationTypes = new Map<IdentifierCategoryKey, TextEditorDecorationType>()

  constructor() {
    this.recreateDecorationTypes()
  }

  /**
   * Disposes of all existing decoration types to prevent memory leaks.
   * This must be called when the extension deactivates or when settings are changed.
   */
  public dispose(): void {
    for (const decoration of this.decorationTypes.values())
      decoration.dispose()

    this.decorationTypes.clear()
    log('[DecorationManager] Disposed all decoration types.')
  }

  /**
   * Recreates all decoration types from scratch based on the current user configuration.
   * This is the core method for enabling dynamic updates of icons and colors.
   * It first disposes of any existing decorations before creating new ones.
   */
  public recreateDecorationTypes(): void {
    this.dispose() // Clean up before creating new ones

    const iconMap = getIconMap()
    const colorMap = getColorMap()

    log('[DecorationManager] Recreating decoration types with icons:', iconMap)
    log('[DecorationManager] Recreating decoration types with colors:', colorMap)

    for (const category of IDENTIFIER_CATEGORIES) {
      const key = category.key
      const icon = iconMap[key]
      const colorValue = colorMap[key]

      // Determine if the color is a theme color ID or a literal value (e.g., #RRGGBB).
      // Our simple heuristic: theme colors contain a dot.
      const color = colorValue.includes('.')
        ? new ThemeColor(colorValue)
        : colorValue

      const decoration = window.createTextEditorDecorationType({
        after: {
          contentText: icon,
          margin: '0 0 0 1.5px',
          color, // This can be a string OR a ThemeColor instance
        },
      })
      this.decorationTypes.set(key, decoration)
    }
  }

  /**
   * Applies all currently managed decorations to a given text editor based
   * on the analysis result.
   *
   * @param editor The active TextEditor to apply decorations to.
   * @param analysisResult The result from the analysis of the Vue file.
   */
  public applyDecorations(editor: TextEditor, analysisResult: AnalysisResult): void {
    for (const category of IDENTIFIER_CATEGORIES) {
      const decoration = this.decorationTypes.get(category.key)
      if (!decoration)
        continue

      // Convert our IdentifierRange[] to vscode.Range[]
      const ranges = analysisResult[category.resultProperty]
        .map((r) => {
          try {
            const startPos = editor.document.positionAt(r.start)
            const endPos = editor.document.positionAt(r.end)
            return new Range(startPos, endPos)
          }
          catch (e) {
            log(`Failed to create range for decoration`, e)
            return null
          }
        })
        .filter((r): r is Range => r !== null) // Filter out nulls on failure

      editor.setDecorations(decoration, ranges)
    }
  }

  /**
   * Clears all decorations from a given editor.
   * This is used when switching to a non-Vue file or when the extension is disabled.
   *
   * @param editor The TextEditor to clear decorations from.
   */
  public clearDecorations(editor: TextEditor): void {
    for (const decoration of this.decorationTypes.values())
      editor.setDecorations(decoration, [])
  }
}
