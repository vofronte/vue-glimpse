import type { AttributeNode, DirectiveNode, ElementNode, InterpolationNode, Node, SimpleExpressionNode, TemplateChildNode } from '@vue/compiler-core'
import type { SFCDescriptor } from '@vue/compiler-sfc'
import type { AnalysisResult, ScriptIdentifiers } from './types.js'
import * as ts from 'typescript'
import * as vscode from 'vscode'
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
  const result: AnalysisResult = { propRanges: [], localStateRanges: [], refRanges: [], reactiveRanges: [], computedRanges: [], methodRanges: [], storeRanges: [] }

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
    const expSourceFile = ts.createSourceFile('exp.ts', expSource, ts.ScriptTarget.Latest, true)

    function walkExpressionAst(node: ts.Node) {
      if (ts.isPropertyAccessExpression(node)) {
        walkExpressionAst(node.expression)
        return
      }
      if (ts.isIdentifier(node)) {
        const varName = node.text
        if (scopeVariables.has(varName)) { return }

        const range = createRange(expOffset + node.getStart(), varName.length, varName)
        if (!range) { return }

        if (identifiers.props.has(varName)) { result.propRanges.push(range) }
        else if (identifiers.store.has(varName)) { result.storeRanges.push(range) }
        else if (identifiers.ref.has(varName)) { result.refRanges.push(range) }
        else if (identifiers.reactive.has(varName)) { result.reactiveRanges.push(range) }
        else if (identifiers.computed.has(varName)) { result.computedRanges.push(range) }
        else if (identifiers.methods.has(varName)) { result.methodRanges.push(range) }
        else if (identifiers.localState.has(varName)) { result.localStateRanges.push(range) }
      }
      ts.forEachChild(node, walkExpressionAst)
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
