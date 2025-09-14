import type { ExtensionContext, TextEditor } from 'vscode'
import { window, workspace } from 'vscode'
import { AnalysisManager } from './analysis/AnalysisManager.js'
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

  // --- Event subscribers setup ---

  // 1. When user changes active tab (editor)
  context.subscriptions.push(
    // Clear cache when a document is closed to prevent memory leaks
    workspace.onDidCloseTextDocument(doc => analysisManager.removeDocument(doc.uri.toString())),
  )

  context.subscriptions.push(
    window.onDidChangeActiveTextEditor((editor) => {
      activeEditor = editor
      if (editor) {
        triggerUpdateDecorations()
      }
    }),
  )

  // 2. When user types in document
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
   * Main "working" function: analyzes code and applies styles.
   */
  function updateDecorations() {
    if (!activeEditor) {
      return
    }

    const document = activeEditor.document

    if (document.languageId !== 'vue') {
      // Clear ALL decoration types
      for (const category of IDENTIFIER_CATEGORIES) {
        activeEditor.setDecorations(category.decoration, [])
      }
      return
    }

    // Get analysis result from our powerful manager
    const analysisResult = analysisManager.getAnalysis(document)

    log(` > Found ${analysisResult.propRanges.length} props, ${analysisResult.localStateRanges.length} locals, ${analysisResult.refRanges.length} refs, ${analysisResult.reactiveRanges.length} reactives, ${analysisResult.computedRanges.length} computed, ${analysisResult.methodRanges.length} methods, ${analysisResult.storeRanges.length} from store, ${analysisResult.emitRanges.length} emits, ${analysisResult.passthroughRanges.length} passthroughs.`)

    for (const category of IDENTIFIER_CATEGORIES) {
      const ranges = analysisResult[category.resultProperty]
      activeEditor.setDecorations(category.decoration, ranges.filter(Boolean))
    }
  }

  if (activeEditor) {
    triggerUpdateDecorations()
  }
}

/**
 * Deactivation function. Called when VS Code or extension is disabled.
 */
export function deactivate() {}
