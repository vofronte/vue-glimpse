import type { SFCScriptBlock } from '@vue/compiler-sfc'
import { BindingTypes } from '@vue/compiler-dom'
import { analyzeScript } from '../../src/parser/scriptAnalyzer.js'

describe('scriptAnalyzer', () => {
  it('should correctly identify props from binding metadata', () => {
    const mockScriptContent = `
      defineProps<{
        myProp: string
      }>()
    `
    const mockScriptBlock = {
      bindings: {
        myProp: BindingTypes.PROPS,
        someRef: BindingTypes.SETUP_REF,
      },
    } as unknown as SFCScriptBlock

    const result = analyzeScript(mockScriptBlock, mockScriptContent)

    expect(result.props).toBeDefined()
    expect(result.props.size).toBe(1)
    expect(result.props.has('myProp')).toBe(true)

    expect(result.ref.has('someRef')).toBe(true)
    expect(result.props.has('someRef')).toBe(false)
  })

  it('should correctly identify reactive state from binding metadata', () => {
    const mockScriptBlock = {
      bindings: {
        myState: BindingTypes.SETUP_REACTIVE_CONST,
      },
    } as unknown as SFCScriptBlock

    const result = analyzeScript(mockScriptBlock, '')

    expect(result.reactive).toBeDefined()
    expect(result.reactive.size).toBe(1)
    expect(result.reactive.has('myState')).toBe(true)

    expect(result.props.has('myState')).toBe(false)
    expect(result.ref.has('myState')).toBe(false)
  })
})
