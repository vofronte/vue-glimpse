import type * as vscode from 'vscode'

export interface AnalysisResult {
  propRanges: vscode.Range[]
  localStateRanges: vscode.Range[]
  refRanges: vscode.Range[]
  reactiveRanges: vscode.Range[]
  computedRanges: vscode.Range[]
  methodRanges: vscode.Range[]
  storeRanges: vscode.Range[]
}

export interface ScriptIdentifiers {
  props: Set<string>
  localState: Set<string>
  ref: Set<string>
  reactive: Set<string>
  computed: Set<string>
  methods: Set<string>
  store: Set<string>
}
