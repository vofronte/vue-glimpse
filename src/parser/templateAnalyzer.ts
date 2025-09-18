import type { AttributeNode, DirectiveNode, ElementNode, InterpolationNode, Node, SimpleExpressionNode, TemplateChildNode } from '@vue/compiler-core'
import type { SFCDescriptor } from '@vue/compiler-sfc'
import type { Node as TSNode } from 'typescript'
import type { AnalysisResult, IdentifierRange, ScriptIdentifiers } from './types.js'
import {
  createSourceFile,
  forEachChild,
  isIdentifier,
  isPropertyAccessExpression,
  ScriptTarget,
} from 'typescript'
import { IDENTIFIER_CATEGORIES, VUE_BUILTIN_HANDLERS } from '../identifierCategories.js'
import { log } from '../utils/logger.js'

// This module is only responsible for producing the decoration ranges.
type TemplateAnalysisResult = Omit<AnalysisResult, 'scriptIdentifiers'>

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

export function analyzeTemplate(descriptor: SFCDescriptor, identifiers: ScriptIdentifiers): TemplateAnalysisResult {
  const result: TemplateAnalysisResult = {
    propsRanges: [],
    localStateRanges: [],
    refRanges: [],
    reactiveRanges: [],
    computedRanges: [],
    methodsRanges: [],
    storeRanges: [],
    emitsRanges: [],
    passthroughRanges: [],
  }

  const allScriptIdentifiers = new Set([
    ...identifiers.props.keys(),
    ...identifiers.localState.keys(),
    ...identifiers.ref.keys(),
    ...identifiers.reactive.keys(),
    ...identifiers.computed.keys(),
    ...identifiers.methods.keys(),
    ...identifiers.store.keys(),
    ...identifiers.emits.keys(),
    ...identifiers.passthrough.keys(),
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

        // Handle special cases for built-in Vue properties
        if (varName.startsWith('$') && !allScriptIdentifiers.has(varName)) {
          const targetRangeProperty = VUE_BUILTIN_HANDLERS.get(varName)
          if (targetRangeProperty) {
            const range = createRange(expOffset + node.getStart(), varName.length, varName)
            if (range) {
              // The type is now correctly inferred
              result[targetRangeProperty].push(range)
            }
            return // Stop processing this identifier
          }
        }

        if (scopeVariables.has(varName)) { return }

        const range = createRange(expOffset + node.getStart(), varName.length, varName)
        if (!range) { return }

        // Find the category for the identifier using our robust config
        for (const category of IDENTIFIER_CATEGORIES) {
          const scriptMap = identifiers[category.scriptProperty]
          if (scriptMap.has(varName)) {
            // The type is now correctly inferred from category.resultProperty
            const resultRanges = result[category.resultProperty]
            resultRanges.push(range)
            return
          }
        }
      }
      forEachChild(node, walkExpressionAst)
    }
    walkExpressionAst(expSourceFile)
  }

  function createRange(start: number, length: number, varName: string): IdentifierRange | null {
    try {
      return { start, end: start + length }
    }
    catch {
      log(`[createRange] Failed for "${varName}" at offset ${start}`)
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
