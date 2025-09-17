import type { CancellationToken, Hover, HoverProvider, Position, TextDocument } from 'vscode'
import type { AnalysisManager } from '../analysis/AnalysisManager.js'
import { MarkdownString, Hover as VsCodeHover } from 'vscode'
import { IDENTIFIER_CATEGORIES } from '../identifierCategories.js'

/**
 * Provides hover information for Vue template variables.
 * It looks up the variable under the cursor in the analysis results
 * and displays its original definition from the <script setup> block.
 */
export class VueGlimpseHoverProvider implements HoverProvider {
  constructor(private analysisManager: AnalysisManager) {}

  /**
   * The core method that provides the hover content.
   * @param document The active text document.
   * @param position The current cursor position.
   * @param _token A cancellation token (unused in this implementation).
   * @returns A VS Code Hover object or undefined if no information is found.
   */
  public provideHover(document: TextDocument, position: Position, _token: CancellationToken): Hover | undefined {
    // Immediately return if the extension is disabled or for non-Vue files
    if (document.languageId !== 'vue') {
      return
    }

    const analysisResult = this.analysisManager.getAnalysis(document)
    if (!analysisResult?.scriptIdentifiers) {
      return
    }

    const wordRange = document.getWordRangeAtPosition(position)
    if (!wordRange) {
      return
    }

    const hoveredWord = document.getText(wordRange)

    // Iterate through categories in their defined priority order
    for (const category of IDENTIFIER_CATEGORIES) {
      const identifierMap = analysisResult.scriptIdentifiers[category.key]
      if (identifierMap.has(hoveredWord)) {
        const details = identifierMap.get(hoveredWord)
        if (details) {
          const markdown = new MarkdownString()

          markdown.appendMarkdown(`\`${category.icon} ${category.label}\``)

          return new VsCodeHover(markdown, wordRange)
        }

        return
      }
    }

    // No identifier found at the hovered position
    return undefined
  }
}
