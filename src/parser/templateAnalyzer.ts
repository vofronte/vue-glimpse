import type { AttributeNode, DirectiveNode, ElementNode, InterpolationNode, Node, SimpleExpressionNode, TemplateChildNode } from '@vue/compiler-core'
import type { SFCDescriptor } from '@vue/compiler-sfc'
import type { Node as TSNode } from 'typescript'
import type { AnalysisResult, ScriptIdentifiers } from './types.js'
import {
  createSourceFile,
  forEachChild,
  isIdentifier,
  isPropertyAccessExpression,
  ScriptTarget,

} from 'typescript'
import * as vscode from 'vscode'
import { IDENTIFIER_CATEGORIES, VUE_BUILTIN_HANDLERS } from '../identifierCategories.js'
import { log } from '../utils/logger.js'

const AST_NODE_TYPES = {
  ELEMENT: 1,
  INTERPOLATION: 5,
  DIRECTIVE: 7,
  SIMPLE_EXPRESSION: 4,
}

function isElementNode(node: Node): node is ElementNode {
  return node.type === AST_NODE_TYPES.ELEMENT
}

function isDirectiveNode(node: AttributeNode | DirectiveNode): node is DirectiveNode {
  return node.type === AST_NODE_TYPES.DIRECTIVE
}

function isSimpleExpressionNode(node?: Node): node is SimpleExpressionNode {
  return !!node && node.type === AST_NODE_TYPES.SIMPLE_EXPRESSION
}

export function analyzeTemplate(descriptor: SFCDescriptor, identifiers: ScriptIdentifiers, document: vscode.TextDocument): AnalysisResult {
  const result: AnalysisResult = { propRanges: [], localStateRanges: [], refRanges: [], reactiveRanges: [], computedRanges: [], methodRanges: [], storeRanges: [], emitRanges: [], passthroughRanges: [] }
  const allScriptIdentifiers = new Set([
    ...identifiers.props,
    ...identifiers.localState,
    ...identifiers.ref,
    ...identifiers.reactive,
    ...identifiers.computed,
    ...identifiers.methods,
    ...identifiers.store,
    ...identifiers.emits,
    ...identifiers.passthrough,
  ])

  function walkTemplateAst(node: TemplateChildNode, scopeVariables: Set<string>) {
    const newScopeVariables = new Set(scopeVariables)

    if (isElementNode(node)) {
      for (const prop of node.props) {
        // Now using type guard `isDirectiveNode`
        if (isDirectiveNode(prop) && isSimpleExpressionNode(prop.exp)) {
          if (prop.name === 'for') {
            extractForLoopVars(prop.exp.content, newScopeVariables)
          }
          if (prop.name === 'slot') {
            newScopeVariables.add(prop.exp.content)
          }
        }
      }

      for (const prop of node.props) {
        if (isDirectiveNode(prop) && isSimpleExpressionNode(prop.exp)) {
          // TypeScript already knows here that prop.exp is SimpleExpressionNode
          analyzeExpression(prop.exp, newScopeVariables)
        }
      }

      for (const child of node.children) {
        walkTemplateAst(child as any, newScopeVariables)
      }
    }
    else if (node.type === AST_NODE_TYPES.INTERPOLATION) {
      const interpolationNode = node as InterpolationNode
      if (isSimpleExpressionNode(interpolationNode.content)) {
        analyzeExpression(interpolationNode.content, newScopeVariables)
      }
    }
  }

  function extractForLoopVars(expression: string, scope: Set<string>) {
    const match = expression.match(/^\s*\(([^)]+)\)\s+in|^\s*([^)\s]+)\s+in/)
    if (match) {
      const loopVars = (match[1] || match[2]).split(',').map(v => v.trim().replace(/[()]/g, ''))
      loopVars.forEach(v => scope.add(v))
    }
  }

  function analyzeExpression(exp: SimpleExpressionNode, scopeVariables: Set<string>) {
    if (!exp || exp.isStatic) { return }

    const expOffset = exp.loc.start.offset
    const expSource = exp.content
    const expSourceFile = createSourceFile('exp.ts', expSource, ScriptTarget.Latest, true)

    function walkExpressionAst(node: TSNode) {
      if (isPropertyAccessExpression(node)) {
        walkExpressionAst(node.expression)
        return
      }
      if (isIdentifier(node)) {
        const varName = node.text

        // Handle special cases for built-in Vue properties using our central map
        if (varName.startsWith('$') && !allScriptIdentifiers.has(varName)) {
          const targetRangeProperty = VUE_BUILTIN_HANDLERS.get(varName)
          if (targetRangeProperty) {
            const range = createRange(expOffset + node.getStart(), varName.length, varName)
            if (range) {
              (result[targetRangeProperty] as vscode.Range[]).push(range)
            }
            return // Stop processing this identifier
          }
        }

        if (scopeVariables.has(varName)) { return }

        const range = createRange(expOffset + node.getStart(), varName.length, varName)
        if (!range) { return }

        // Find the category for the identifier by looping through our config
        for (const category of IDENTIFIER_CATEGORIES) {
          const scriptSet = identifiers[category.scriptProperty] as Set<string>
          if (scriptSet.has(varName)) {
            const resultRanges = result[category.resultProperty] as vscode.Range[]
            resultRanges.push(range)
            return
          }
        }
      }
      forEachChild(node, walkExpressionAst)
    }
    walkExpressionAst(expSourceFile)
  }

  function createRange(absoluteOffset: number, length: number, varName: string): vscode.Range | null {
    try {
      const startPos = document.positionAt(absoluteOffset)
      const endPos = document.positionAt(absoluteOffset + length)
      return new vscode.Range(startPos, endPos)
    }
    catch {
      log(`[createRange] Failed for "${varName}" at offset ${absoluteOffset}`)
      return null
    }
  }

  if (descriptor.template?.ast) {
    for (const childNode of descriptor.template.ast.children) {
      walkTemplateAst(childNode as any, new Set())
    }
  }
  return result
}
