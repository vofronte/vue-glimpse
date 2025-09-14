import type { ExtensionContext, TextEditor } from 'vscode'
import { window, workspace } from 'vscode'
import {
  computedDecorationType,
  localStateDecorationType,
  methodDecorationType,
  propDecorationType,
  reactiveDecorationType,
  refDecorationType,
  storeDecorationType,
} from './decorators.js'
import { analyzeVueFile } from './parser/index.js'
import { log } from './utils/logger.js'

let activeEditor: TextEditor | undefined = window.activeTextEditor
let timeout: NodeJS.Timeout | undefined

/**
 * Main extension activation function. Called when first opening a .vue file.
 */
export function activate(context: ExtensionContext) {
  log('VueGlimpse is now active!')

  // --- Event subscribers setup ---

  // 1. When user changes active tab (editor)
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

    if (activeEditor.document.languageId !== 'vue') {
      // Clear ALL decoration types
      activeEditor.setDecorations(propDecorationType, [])
      activeEditor.setDecorations(localStateDecorationType, [])
      activeEditor.setDecorations(refDecorationType, [])
      activeEditor.setDecorations(reactiveDecorationType, [])
      activeEditor.setDecorations(computedDecorationType, [])
      activeEditor.setDecorations(methodDecorationType, [])
      activeEditor.setDecorations(storeDecorationType, [])
      return
    }

    log(`Analyzing ${activeEditor.document.fileName}...`)
    const code = activeEditor.document.getText()

    // Get extended result from parser
    const { propRanges, localStateRanges, refRanges, reactiveRanges, computedRanges, methodRanges, storeRanges } = analyzeVueFile(code, activeEditor.document)

    log(` > Found ${propRanges.length} props, ${localStateRanges.length} locals, ${refRanges.length} refs, ${reactiveRanges.length} reactives, ${computedRanges.length} computed, ${methodRanges.length} methods, ${storeRanges.length} from store.`)

    activeEditor.setDecorations(propDecorationType, propRanges)
    activeEditor.setDecorations(localStateDecorationType, localStateRanges)
    activeEditor.setDecorations(refDecorationType, refRanges)
    activeEditor.setDecorations(reactiveDecorationType, reactiveRanges)
    activeEditor.setDecorations(computedDecorationType, computedRanges)
    activeEditor.setDecorations(methodDecorationType, methodRanges)
    activeEditor.setDecorations(storeDecorationType, storeRanges)
  }

  // --- Initial launch ---
  if (activeEditor) {
    triggerUpdateDecorations()
  }
}

/**
 * Deactivation function. Called when VS Code or extension is disabled.
 */
export function deactivate() {}
