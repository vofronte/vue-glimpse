import * as vscode from 'vscode';

export interface AnalysisResult {
    propRanges: vscode.Range[];
    localStateRanges: vscode.Range[];
    computedRanges: vscode.Range[];
    methodRanges: vscode.Range[];
    storeRanges: vscode.Range[];
}

export type ScriptIdentifiers = {
    props: Set<string>;
    localState: Set<string>;
    computed: Set<string>;
    methods: Set<string>;
    store: Set<string>;
};