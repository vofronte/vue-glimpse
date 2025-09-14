import type { Range } from 'vscode'

export interface AnalysisResult {
  propRanges: Range[]
  localStateRanges: Range[]
  refRanges: Range[]
  reactiveRanges: Range[]
  computedRanges: Range[]
  methodRanges: Range[]
  storeRanges: Range[]
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
