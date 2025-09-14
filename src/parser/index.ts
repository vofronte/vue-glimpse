import type { TextDocument } from 'vscode'
import type { AnalysisResult } from './types.js'
import { compileScript, parse } from '@vue/compiler-sfc'
import { log, logError } from '../utils/logger.js'
import { analyzeScript } from './scriptAnalyzer.js'
import { analyzeTemplate } from './templateAnalyzer.js'

// A simple counter for a unique ID for compileScript
let compileId = 0

export function analyzeVueFile(code: string, document: TextDocument): AnalysisResult {
  const emptyResult: AnalysisResult = { propRanges: [], localStateRanges: [], refRanges: [], reactiveRanges: [], computedRanges: [], methodRanges: [], storeRanges: [], emitRanges: [], passthroughRanges: [] }

  try {
    // Step 1: Parse the SFC to get the descriptor.
    const { descriptor, errors } = parse(code, { filename: document.uri.fsPath })
    if (errors.length > 0) {
      log('SFC parse errors:', errors.map(e => e.message))
    }

    if (!descriptor.scriptSetup) {
      return emptyResult
    }

    // Step 2: Compile the script to get binding metadata. This is our "oracle".
    const scriptBlock = compileScript(descriptor, {
      id: `vue-glimpse-${compileId++}`,
      // We don't need template inlining, source maps, etc. for our analysis.
      // Keep options minimal for performance.
    })

    // Step 3: Analyze the script, providing both the compiled result (for bindings)
    // and the original content (for finding macros like defineEmits).
    const scriptIdentifiers = analyzeScript(scriptBlock, descriptor.scriptSetup.content)

    log('SCRIPT ANALYSIS RESULT:', {
      props: [...scriptIdentifiers.props],
      localState: [...scriptIdentifiers.localState],
      ref: [...scriptIdentifiers.ref],
      reactive: [...scriptIdentifiers.reactive],
      computed: [...scriptIdentifiers.computed],
      methods: [...scriptIdentifiers.methods],
      store: [...scriptIdentifiers.store],
      emits: [...scriptIdentifiers.emits],
      passthrough: [...scriptIdentifiers.passthrough],
    })

    // Step 4: Analyze the template using the script analysis results.
    if (descriptor.template?.ast) {
      return analyzeTemplate(descriptor, scriptIdentifiers, document)
    }

    return emptyResult
  }
  catch (error) {
    logError('FATAL ERROR during analysis.', error)
    return emptyResult
  }
}
