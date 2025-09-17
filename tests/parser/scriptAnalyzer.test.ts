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
})
