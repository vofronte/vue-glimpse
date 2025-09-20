import type { TextDocument } from 'vscode'
import type { AnalysisResult } from '../parser/types.js'
import { analyzeVueFile, createEmptyAnalysisResult } from '../parser/index.js'
import { log } from '../utils/logger.js'

interface CacheEntry {
  version: number
  result: AnalysisResult
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
   * it's returned instantly. Otherwise, it performs a full analysis and
   * caches the new result.
   *
   * If analysis fails due to a syntax error, it will attempt to return a
   * stale (previous) result from the cache instead of clearing decorations.
   *
   * @param document The TextDocument to analyze.
   * @returns The analysis result for the document. Never null.
   */
  public getAnalysis(document: TextDocument): AnalysisResult {
    const cachedEntry = this.cache.get(document.uri.toString())

    if (cachedEntry && cachedEntry.version === document.version) {
      log(`[Cache] HIT for ${document.fileName} v${document.version}`)
      return cachedEntry.result
    }

    log(`[Cache] MISS for ${document.fileName} v${document.version}. Analyzing...`)
    const newResult = analyzeVueFile(document.getText(), document)

    // Case 1: Analysis was successful.
    if (newResult) {
      this.cache.set(document.uri.toString(), {
        version: document.version,
        result: newResult,
      })
      return newResult
    }

    // Case 2: Analysis failed (e.g., syntax error).
    log('[Analysis] Failed. Attempting to use stale cache.')
    if (cachedEntry) {
      log(`[Cache] SERVING STALE for ${document.fileName} (v${cachedEntry.version})`)
      return cachedEntry.result // Return the last known good result.
    }

    // Case 3: Analysis failed and there's no cached version.
    log('[Analysis] No stale cache available. Returning empty result.')
    return createEmptyAnalysisResult()
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
