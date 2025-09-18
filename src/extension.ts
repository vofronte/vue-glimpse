import type { ExtensionContext, TextEditor, TextEditorDecorationType } from 'vscode'
import type { IdentifierCategoryKey } from './parser/types.js'
import { languages, Range, ThemeColor, window, workspace } from 'vscode'
import { AnalysisManager } from './analysis/AnalysisManager.js'
import { CATEGORY_ICONS } from './categoryConfig.js'
import { DECORATION_CONFIG } from './decorators.js'
import { VueGlimpseHoverProvider } from './features/hoverProvider.js'
import { IDENTIFIER_CATEGORIES } from './identifierCategories.js'
import { log } from './utils/logger.js'

let activeEditor: TextEditor | undefined = window.activeTextEditor
let timeout: NodeJS.Timeout | undefined

/**
 * Main extension activation function. Called when first opening a .vue file.
 */
export function activate(context: ExtensionContext) {
  log('VueGlimpse is now active!')

  // --- Create and manage decorations within the activation context ---
  const decorationTypes = new Map<IdentifierCategoryKey, TextEditorDecorationType>()

  for (const category of IDENTIFIER_CATEGORIES) {
    const key = category.key
    const config = DECORATION_CONFIG[key]
    const icon = CATEGORY_ICONS[key]
    const decoration = window.createTextEditorDecorationType({
      after: {
        contentText: icon,
        margin: '0 0 0 1.5px',
        color: new ThemeColor(config.color),
      },
    })
    decorationTypes.set(key, decoration)
  }

  const analysisManager = new AnalysisManager()

  // --- Register Hover Provider ---
  // The hover provider is instantiated once and registered for the 'vue' language.
  const hoverProvider = new VueGlimpseHoverProvider(analysisManager)
  context.subscriptions.push(
    languages.registerHoverProvider('vue', hoverProvider),
  )

  // --- Event subscribers setup ---

  // 1. Clear cache when a document is closed to prevent memory leaks
  context.subscriptions.push(
    workspace.onDidCloseTextDocument(doc => analysisManager.removeDocument(doc.uri.toString())),
  )

  // 2. When user changes active tab (editor)
  context.subscriptions.push(
    window.onDidChangeActiveTextEditor((editor) => {
      activeEditor = editor
      if (editor) {
        triggerUpdateDecorations()
      }
    }),
  )

  // 3. When user types in document
  context.subscriptions.push(
    workspace.onDidChangeTextDocument((event) => {
      // Update only if changes occurred in active editor
      if (activeEditor && event.document === activeEditor.document) {
        triggerUpdateDecorations()
      }
    }),
  )

  // --- Decoration update logic ---

  /**
   * "Debouncer": runs `updateDecorations` not on every keystroke,
   * but only after a short pause to avoid system overload.
   */
  function triggerUpdateDecorations() {
    if (timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }

    timeout = setTimeout(updateDecorations, 300)
  }

  /**
   * Main "working" function: analyzes code and applies decoration styles.
   */
  function updateDecorations() {
    if (!activeEditor) {
      return
    }

    const document = activeEditor.document

    if (document.languageId !== 'vue') {
      // Use the new map to clear decorations
      for (const decoration of decorationTypes.values())
        activeEditor.setDecorations(decoration, [])

      return
    }

    const analysisResult = analysisManager.getAnalysis(document)

    // Apply decorations for each category using the new result structure
    for (const category of IDENTIFIER_CATEGORIES) {
      // Convert our IdentifierRange[] to vscode.Range[]
      const ranges = analysisResult[category.resultProperty]
        .map((r) => {
          try {
            const startPos = document.positionAt(r.start)
            const endPos = document.positionAt(r.end)
            return new Range(startPos, endPos)
          }
          catch (e) {
            log(`Failed to create range for decoration`, e)
            return null
          }
        })
        .filter((r): r is Range => r !== null) // Filter out nulls on failure

      const decoration = decorationTypes.get(category.key)
      if (decoration)
        activeEditor.setDecorations(decoration, ranges)
    }
  }

  // Initial run for the currently active editor
  if (activeEditor) {
    triggerUpdateDecorations()
  }
}

/**
 * Deactivation function. Called when VS Code or extension is disabled.
 */
export function deactivate() {}
