import type { TextDocument } from 'vscode'
import type { AnalysisResult } from '../parser/types.js'
import { analyzeVueFile, createEmptyAnalysisResult } from '../parser/index.js'
import { log } from '../utils/logger.js'

interface CacheEntry {
  version: number
  result: AnalysisResult
}

export interface ManagedAnalysisResult {
  result: AnalysisResult
  status: 'ok' | 'stale' | 'failed'
  error?: unknown
}

/**
 * Manages the analysis of Vue files, incorporating a cache to avoid
 * re-analyzing unchanged documents.
 */
export class AnalysisManager {
  private cache = new Map<string, CacheEntry>()

  /**
   * Retrieves the analysis result for a given document.
   * It will first check a cache. If a valid, up-to-date result is found,
   * it's returned instantly with an 'ok' status.
   *
   * If analysis fails due to a syntax error, it will return a stale result
   * with a 'stale' status, or an empty result with a 'failed' status
   * if no cache is available.
   *
   * @param document The TextDocument to analyze.
   * @returns A ManagedAnalysisResult object containing the result, status, and optional error.
   */
  public getAnalysis(document: TextDocument): ManagedAnalysisResult {
    const cachedEntry = this.cache.get(document.uri.toString())

    if (cachedEntry && cachedEntry.version === document.version) {
      log(`[Cache] HIT for ${document.fileName} v${document.version}`)
      return { result: cachedEntry.result, status: 'ok' }
    }

    log(`[Cache] MISS for ${document.fileName} v${document.version}. Analyzing...`)

    try {
      const newResult = analyzeVueFile(document.getText(), document)
      this.cache.set(document.uri.toString(), {
        version: document.version,
        result: newResult,
      })
      return { result: newResult, status: 'ok' }
    }
    catch (error) {
      // Analysis failed. Attempt to use stale cache.
      if (cachedEntry) {
        log(`[Cache] SERVING STALE for ${document.fileName} (v${cachedEntry.version}) due to error.`)
        return { result: cachedEntry.result, status: 'stale', error }
      }

      // Analysis failed and there's no cached version.
      log('[Analysis] No stale cache available. Returning empty result.')
      return { result: createEmptyAnalysisResult(), status: 'failed', error }
    }
  }

  /**
   * Removes a single document entry from the cache.
   * More efficient than clearing the entire cache.
   * @param documentUri The URI of the document to remove.
   */
  public removeDocument(documentUri: string): void {
    if (this.cache.has(documentUri)) {
      this.cache.delete(documentUri)
      log(`[Cache] Removed entry for ${documentUri}`)
    }
  }

  /**
   * Clears the entire analysis cache.
   */
  public clearCache(): void {
    this.cache.clear()
    log('[Cache] Cleared.')
  }
}
