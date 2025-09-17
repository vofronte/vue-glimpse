import type { ExtensionContext, TextEditor } from 'vscode'
import { languages, window, workspace } from 'vscode'
import { AnalysisManager } from './analysis/AnalysisManager.js'
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
      // Clear ALL decoration types if the file is not a Vue component
      for (const category of IDENTIFIER_CATEGORIES) {
        activeEditor.setDecorations(category.decoration, [])
      }
      return
    }

    // Get analysis result from our powerful, cached manager
    const analysisResult = analysisManager.getAnalysis(document)

    // Apply decorations for each category using the new result structure
    for (const category of IDENTIFIER_CATEGORIES) {
      // Access the correct pluralized range property (e.g., 'propsRanges')
      const ranges = analysisResult[category.resultProperty]
      // The filter is a safeguard against any potential null/undefined ranges
      activeEditor.setDecorations(category.decoration, ranges.filter(Boolean))
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
