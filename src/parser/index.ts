import * as vscode from 'vscode';
import { parse } from '@vue/compiler-sfc';
import { AnalysisResult } from './types';
import { analyzeScript } from './scriptAnalyzer';
import { analyzeTemplate } from './templateAnalyzer';
import { log, logError } from '../utils/logger'; 

export function analyzeVueFile(code: string, document: vscode.TextDocument): AnalysisResult {
    const emptyResult: AnalysisResult = { propRanges: [], localStateRanges: [], computedRanges: [], methodRanges: [], storeRanges: [] };
    try {
        const { descriptor } = parse(code, { filename: 'component.vue' });
        if (!descriptor.scriptSetup || !descriptor.template?.ast) {
            return emptyResult;
        }

        const scriptIdentifiers = analyzeScript(descriptor.scriptSetup.content);
        log('SCRIPT ANALYSIS RESULT:', {
            props: [...scriptIdentifiers.props],
            localState: [...scriptIdentifiers.localState],
            computed: [...scriptIdentifiers.computed],
            methods: [...scriptIdentifiers.methods],
            store: [...scriptIdentifiers.store],
        });
        
        return analyzeTemplate(descriptor, scriptIdentifiers, document);
    } catch (error) {
        logError('FATAL ERROR during analysis.', error); 
        return emptyResult;
    }
}