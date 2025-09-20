import type { ExtensionContext, TextEditor } from 'vscode'
import { languages, window, workspace } from 'vscode'
import { AnalysisManager } from './analysis/analysisManager.js'
import { DecorationManager } from './features/decorationManager.js'
import { VueGlimpseHoverProvider } from './features/hoverProvider.js'
import { log } from './utils/logger.js'

let activeEditor: TextEditor | undefined = window.activeTextEditor
let timeout: NodeJS.Timeout | undefined
let decorationManager: DecorationManager
let analysisManager: AnalysisManager

/**
 * Main extension activation function. Called when first opening a .vue file.
 */
export function activate(context: ExtensionContext) {
  log('VueGlimpse is now active!')

  // --- Initialize Managers ---
  analysisManager = new AnalysisManager()
  decorationManager = new DecorationManager()

  // --- Register Hover Provider ---
  const hoverProvider = new VueGlimpseHoverProvider(analysisManager)
  context.subscriptions.push(
    languages.registerHoverProvider('vue', hoverProvider),
  )

  // --- Event subscribers setup ---
  context.subscriptions.push(
    // 1. Listen for configuration changes
    workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration('vueGlimpse.icons.override')
        || event.affectsConfiguration('vueGlimpse.colors.override')
      ) {
        log('[Configuration] Settings changed. Recreating decorations.')
        decorationManager.recreateDecorationTypes()
        triggerUpdateDecorations(0) // Force an immediate update
      }
    }),

    // 2. Clear cache when a document is closed
    workspace.onDidCloseTextDocument(doc => analysisManager.removeDocument(doc.uri.toString())),

    // 3. Update on active editor change
    window.onDidChangeActiveTextEditor((editor) => {
      activeEditor = editor
      if (editor && editor.document)
        triggerUpdateDecorations()
    }),

    // 4. Update on text change
    workspace.onDidChangeTextDocument((event) => {
      if (activeEditor && event.document === activeEditor.document)
        triggerUpdateDecorations()
    }),
  )

  // Initial run for the currently active editor
  if (activeEditor && activeEditor.document)
    triggerUpdateDecorations()
}

/**
 * "Debouncer": runs `updateDecorations` after a short pause.
 */
function triggerUpdateDecorations(delay = 300) {
  if (timeout) {
    clearTimeout(timeout)
    timeout = undefined
  }
  timeout = setTimeout(updateDecorations, delay)
}

/**
 * Main "working" function: analyzes code and applies decorations.
 */
function updateDecorations() {
  if (!activeEditor || !activeEditor.document)
    return

  const { document } = activeEditor
  if (document.languageId !== 'vue') {
    decorationManager.clearDecorations(activeEditor)
    return
  }

  const analysisResult = analysisManager.getAnalysis(document)
  decorationManager.applyDecorations(activeEditor, analysisResult)
}

/**
 * Deactivation function.
 */
export function deactivate() {
  if (decorationManager)
    decorationManager.dispose()
}
