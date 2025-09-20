import type { Program as BabelProgram } from '@babel/types'
import type { Node as TSNode, SourceFile as TSSourceFile } from 'typescript'
import { forEachChild, isIdentifier, isImportDeclaration, isImportSpecifier } from 'typescript'

export interface ImportAnalysis {
  hasPinia: boolean
  hasVuex: boolean
  piniaImportNames: Set<string>
  vuexImportNames: Set<string>
}

/**
 * Analyzes the AST of a script to detect imports from Pinia or Vuex.
 * This function is designed to work with both Babel and TypeScript ASTs.
 *
 * @param astNode The root AST node (Babel Program or TypeScript SourceFile).
 * @returns An object indicating the presence and specific named imports from Pinia or Vuex.
 */
export function analyzeImports(astNode: BabelProgram | TSSourceFile): ImportAnalysis {
  const result: ImportAnalysis = {
    hasPinia: false,
    hasVuex: false,
    piniaImportNames: new Set(),
    vuexImportNames: new Set(),
  }

  // --- Handle TypeScript AST (from typescript) ---
  if ('kind' in astNode) {
    const tsAst = astNode
    const tsWalk = (node: TSNode) => {
      if (isImportDeclaration(node)) {
        const specifier = node.moduleSpecifier.getText(tsAst).replace(/['"]/g, '')
        let targetSet: Set<string> | undefined

        if (specifier === 'pinia') {
          result.hasPinia = true
          targetSet = result.piniaImportNames
        }
        else if (specifier === 'vuex') {
          result.hasVuex = true
          targetSet = result.vuexImportNames
        }

        if (targetSet && node.importClause) {
          node.importClause.namedBindings?.forEachChild((childNode) => {
            if (isImportSpecifier(childNode) && isIdentifier(childNode.name))
              targetSet!.add(childNode.name.text)
          })
        }
      }
    }
    forEachChild(tsAst, tsWalk)
    return result
  }

  // --- Handle Babel AST (from @babel/parser) ---
  if ('body' in astNode) {
    const babelAst = astNode
    for (const node of babelAst.body) {
      if (node.type === 'ImportDeclaration') {
        let targetSet: Set<string> | undefined
        if (node.source.value === 'pinia') {
          result.hasPinia = true
          targetSet = result.piniaImportNames
        }
        else if (node.source.value === 'vuex') {
          result.hasVuex = true
          targetSet = result.vuexImportNames
        }

        if (targetSet) {
          for (const specifier of node.specifiers) {
            if (specifier.type === 'ImportSpecifier')
              targetSet.add(specifier.local.name)
          }
        }
      }
    }
    return result
  }

  return result
}
