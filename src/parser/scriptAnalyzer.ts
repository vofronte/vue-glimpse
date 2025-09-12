import * as ts from 'typescript';
import { ScriptIdentifiers } from './types';

export function analyzeScript(scriptContent: string): ScriptIdentifiers {
    const identifiers: ScriptIdentifiers = { props: new Set<string>(), localState: new Set<string>(), computed: new Set<string>(), methods: new Set<string>(), store: new Set<string>() };
    const sourceFile = ts.createSourceFile('component.ts', scriptContent, ts.ScriptTarget.Latest, true);

    ts.forEachChild(sourceFile, node => {
        // `defineProps({...})` без присваивания
        if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
            const callExpr = node.expression;
            if (ts.isIdentifier(callExpr.expression) && callExpr.expression.text === 'defineProps') {
                if (callExpr.arguments.length > 0 && ts.isObjectLiteralExpression(callExpr.arguments[0])) {
                    callExpr.arguments[0].properties.forEach(prop => {
                        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
                            identifiers.props.add(prop.name.text);
                        }
                    });
                }
            }
        }

        if (node.parent !== sourceFile) { return; }
        if (ts.isFunctionDeclaration(node) && node.name) { identifiers.methods.add(node.name.text); }
        if (ts.isVariableStatement(node)) {
            for (const declaration of node.declarationList.declarations) {
                let kind: 'props' | 'store' | 'computed' | 'methods' | 'local' | null = null;
                
                if (declaration.initializer && ts.isCallExpression(declaration.initializer)) {
                    if (ts.isIdentifier(declaration.initializer.expression)) {
                        const callName = declaration.initializer.expression.text;
                        if (callName === 'defineProps') {kind = 'props';}
                        else if (callName === 'storeToRefs') {kind = 'store';}
                        else if (/^use[A-Z].*Store$/.test(callName)) {kind = 'store';}
                        else if (callName === 'computed') {kind = 'computed';}
                    }
                } else if (declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) {
                    kind = 'methods';
                }

                if (ts.isIdentifier(declaration.name)) {
                    const name = declaration.name.text;
                    if (kind === 'store') {identifiers.store.add(name);}
                    else if (kind === 'computed') {identifiers.computed.add(name);}
                    else if (kind === 'methods') {identifiers.methods.add(name);}
                    else {identifiers.localState.add(name);}
                } else if (ts.isObjectBindingPattern(declaration.name)) {
                    for (const element of declaration.name.elements) {
                        if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
                            const name = element.name.text;
                            if (kind === 'props') {identifiers.props.add(name);}
                            else if (kind === 'store') {identifiers.store.add(name);}
                        }
                    }
                }
            }
        }
    });

    // Очистка: если переменная была определена как-то конкретно (prop, store),
    // она не может быть одновременно localState.
    for (const key in identifiers) {
        if (key !== 'localState') {
            for (const name of (identifiers as any)[key]) {
                if (identifiers.localState.has(name)) { identifiers.localState.delete(name); }
            }
        }
    }
    return identifiers;
}