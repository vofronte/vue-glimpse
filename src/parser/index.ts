import type { SFCDescriptor } from '@vue/compiler-sfc'
import type { TextDocument } from 'vscode'
import type { AnalysisResult, ScriptIdentifiers } from './types.js'
import { compileScript, parse } from '@vue/compiler-sfc'
import { log, logError } from '../utils/logger.js'
import { analyzeOptionsApi } from './optionsApi/analyzer.js'
import { analyzeScript } from './scriptSetup/analyzer.js'
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
    pinia: new Map(),
    vuex: new Map(),
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
    piniaRanges: [],
    vuexRanges: [],
    emitsRanges: [],
    passthroughRanges: [],
    scriptIdentifiers: emptyIdentifiers,
  }
}

/**
 * Analyzes a <script setup> block.
 * This function contains the original analysis logic.
 * @param descriptor The SFC descriptor.
 * @returns A comprehensive analysis result or null on failure.
 */
function analyzeScriptSetup(descriptor: SFCDescriptor): AnalysisResult | null {
  if (!descriptor.scriptSetup)
    return createEmptyAnalysisResult()

  // Step 2: Compile the script to get binding metadata. This is our "oracle".
  const scriptBlock = compileScript(descriptor, {
    id: `vue-glimpse-${compileId++}`,
  })

  // Step 3: Analyze the script to get detailed identifier metadata.
  const scriptIdentifiers = analyzeScript(scriptBlock, descriptor.scriptSetup.content)

  // Step 4: Analyze the template to get decoration ranges.
  if (descriptor.template?.ast) {
    const templateAnalysis = analyzeTemplate(descriptor, scriptIdentifiers)
    // Combine the results into a single comprehensive object.
    return { ...templateAnalysis, scriptIdentifiers }
  }

  // Return only script analysis if no template exists.
  return { ...createEmptyAnalysisResult(), scriptIdentifiers }
}

export function analyzeVueFile(code: string, document: TextDocument): AnalysisResult | null {
  try {
    // Step 1: Parse the SFC to get the descriptor. This is universal.
    const { descriptor, errors } = parse(code, { filename: document.uri.fsPath })
    if (errors.length > 0) {
      log('SFC parse errors:', errors.map(e => e.message))
    }

    // DISPATCHER LOGIC
    if (descriptor.scriptSetup) {
      // Use the dedicated analyzer for <script setup>
      return analyzeScriptSetup(descriptor)
    }
    else if (descriptor.script) {
      // Use the dedicated analyzer for Options API
      return analyzeOptionsApi(descriptor)
    }

    // No script blocks found, return empty result
    return createEmptyAnalysisResult()
  }
  catch (error) {
    logError('FATAL ERROR during analysis.', error)
    // Return null to signal that analysis failed and a stale result should be used if available.
    return null
  }
}
