import * as vscode from 'vscode';
import { SFCDescriptor } from '@vue/compiler-sfc';
import * as ts from 'typescript';
import { TemplateChildNode, ElementNode, InterpolationNode, SimpleExpressionNode } from '@vue/compiler-core';
import { AnalysisResult, ScriptIdentifiers } from './types';
import { log } from '../utils/logger';

export function analyzeTemplate(descriptor: SFCDescriptor, identifiers: ScriptIdentifiers, document: vscode.TextDocument): AnalysisResult {
    const result: AnalysisResult = { propRanges: [], localStateRanges: [], computedRanges: [], methodRanges: [], storeRanges: [] };

    function walkTemplateAst(node: TemplateChildNode, scopeVariables: Set<string>) {
        let newScopeVariables = new Set(scopeVariables);
        if (node.type === 1 /* ELEMENT */) {
            for (const prop of (node as ElementNode).props) {
                if (prop.type === 7 /* DIRECTIVE */ && prop.name === 'for' && prop.exp?.type === 4 /* SIMPLE_EXPRESSION */) {
                    const forExp = prop.exp.content;
                    const match = forExp.match(/^\s*\(([^)]+)\)\s+in|^\s*([^)\s]+)\s+in/);
                    if (match) {
                        const loopVars = (match[1] || match[2]).split(',').map((v: string) => v.trim());
                        loopVars.forEach((v: string) => newScopeVariables.add(v));
                    }
                }
            }
        }
        if (node.type === 5 /* INTERPOLATION */) {
            const content = (node as InterpolationNode).content;
            if (content?.type === 4 /* SIMPLE_EXPRESSION */) { analyzeExpression(content, newScopeVariables); }
        } else if (node.type === 1 /* ELEMENT */) {
            for (const prop of (node as ElementNode).props) {
                if (prop.type === 7 /* DIRECTIVE */ && prop.exp?.type === 4 /* SIMPLE_EXPRESSION */) { analyzeExpression(prop.exp, newScopeVariables); }
            }
        }
        if ('children' in node && Array.isArray((node as any).children)) {
            for (const child of (node as any).children) { walkTemplateAst(child as any, newScopeVariables); }
        }
    }

    function analyzeExpression(exp: SimpleExpressionNode, scopeVariables: Set<string>) {
        // Если у выражения нет местоположения или оно пустое, игнорируем его.
        if (!exp || exp.isStatic || !exp.loc || exp.loc.source === '') {
            return;
        }

        const expOffset = exp.loc.start.offset;
        const expSource = exp.content;
        const expSourceFile = ts.createSourceFile('exp.ts', expSource, ts.ScriptTarget.Latest, true);
        
        function walkExpressionAst(node: ts.Node) {
            if (ts.isPropertyAccessExpression(node)) {
                walkExpressionAst(node.expression);
                return;
            }
            let identifierNode: ts.Identifier | undefined;
            if (ts.isIdentifier(node)) { identifierNode = node; }
            
            if (identifierNode) {
                const varName = identifierNode.text;
                if (scopeVariables.has(varName)) {return;}

                const nodeStart = identifierNode.getStart(expSourceFile);
                const nodeLength = identifierNode.getWidth(expSourceFile);
                const finalOffset = expOffset + nodeStart;
                const range = createRange(finalOffset, nodeLength, varName);
                if (!range) {return;}

                if (identifiers.props.has(varName)) {result.propRanges.push(range);}
                else if (identifiers.store.has(varName)) {result.storeRanges.push(range);}
                else if (identifiers.computed.has(varName)) {result.computedRanges.push(range);}
                else if (identifiers.methods.has(varName)) {result.methodRanges.push(range);}
                else if (identifiers.localState.has(varName)) {result.localStateRanges.push(range);}
            }
            ts.forEachChild(node, walkExpressionAst);
        }
        walkExpressionAst(expSourceFile);
    }

    function createRange(absoluteOffset: number, length: number, varName: string): vscode.Range | null {
        try {
            const startPos = document.positionAt(absoluteOffset);
            const endPos = document.positionAt(absoluteOffset + length);
            return new vscode.Range(startPos, endPos);
        } catch (e) {
            log(`[createRange] Failed for "${varName}" at offset ${absoluteOffset}`);
            return null;
        }
    }

    if (descriptor.template?.ast) {
        for (const childNode of descriptor.template.ast.children) {
            walkTemplateAst(childNode as any, new Set());
        }
    }
    return result;
}