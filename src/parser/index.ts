import type { TextDocument } from 'vscode'
import type { AnalysisResult, ScriptIdentifiers } from './types.js'
import { compileScript, parse } from '@vue/compiler-sfc'
import { log, logError } from '../utils/logger.js'
import { analyzeScript } from './scriptAnalyzer.js'
import { analyzeTemplate } from './templateAnalyzer.js'

// A simple counter for a unique ID for compileScript
let compileId = 0

/**
 * Creates an empty, fully initialized AnalysisResult object.
 * This is used as a default/fallback return value.
 * @returns An empty AnalysisResult.
 */
export function createEmptyAnalysisResult(): AnalysisResult {
  const emptyIdentifiers: ScriptIdentifiers = {
    props: new Map(),
    localState: new Map(),
    ref: new Map(),
    reactive: new Map(),
    computed: new Map(),
    methods: new Map(),
    store: new Map(),
    emits: new Map(),
    passthrough: new Map(),
  }

  return {
    propsRanges: [],
    localStateRanges: [],
    refRanges: [],
    reactiveRanges: [],
    computedRanges: [],
    methodsRanges: [],
    storeRanges: [],
    emitsRanges: [],
    passthroughRanges: [],
    scriptIdentifiers: emptyIdentifiers,
  }
}

export function analyzeVueFile(code: string, document: TextDocument): AnalysisResult | null {
  try {
    // Step 1: Parse the SFC to get the descriptor.
    const { descriptor, errors } = parse(code, { filename: document.uri.fsPath })
    if (errors.length > 0) {
      log('SFC parse errors:', errors.map(e => e.message))
      // Unlike compileScript, parse errors are often not fatal. We can proceed.
    }

    if (!descriptor.scriptSetup) {
      return createEmptyAnalysisResult()
    }

    // Step 2: Compile the script to get binding metadata. This is our "oracle".
    const scriptBlock = compileScript(descriptor, {
      id: `vue-glimpse-${compileId++}`,
      // We don't need template inlining, source maps, etc. for our analysis.
      // Keep options minimal for performance.
    })

    // Step 3: Analyze the script to get detailed identifier metadata.
    const scriptIdentifiers = analyzeScript(scriptBlock, descriptor.scriptSetup.content)

    // Step 4: Analyze the template to get decoration ranges.
    if (descriptor.template?.ast) {
      const templateAnalysis = analyzeTemplate(descriptor, scriptIdentifiers, document)
      // Combine the results into a single comprehensive object.
      return { ...templateAnalysis, scriptIdentifiers }
    }

    // Return only script analysis if no template exists.
    return { ...createEmptyAnalysisResult(), scriptIdentifiers }
  }
  catch (error) {
    logError('FATAL ERROR during analysis.', error)
    // Return null to signal that analysis failed and a stale result should be used if available.
    return null
  }
}
