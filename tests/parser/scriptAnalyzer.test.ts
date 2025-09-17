import type { SFCScriptBlock } from '@vue/compiler-sfc'
import { BindingTypes } from '@vue/compiler-dom'
import { analyzeScript } from '../../src/parser/scriptAnalyzer.js'

describe('scriptAnalyzer', () => {
  it('should correctly identify props from binding metadata', () => {
    const mockScriptContent = `
      import { ref } from 'vue'
      defineProps<{
        myProp: string
      }>()
      const someRef = ref(null)
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
    const mockScriptContent = `
      import { reactive } from 'vue'
      const myState = reactive({ value: 1 })
    `
    const mockScriptBlock = {
      bindings: {
        myState: BindingTypes.SETUP_REACTIVE_CONST,
      },
    } as unknown as SFCScriptBlock

    const result = analyzeScript(mockScriptBlock, mockScriptContent)

    expect(result.reactive).toBeDefined()
    expect(result.reactive.size).toBe(1)
    expect(result.reactive.has('myState')).toBe(true)

    expect(result.props.has('myState')).toBe(false)
    expect(result.ref.has('myState')).toBe(false)
  })

  it('should distinguish methods from local constants using AST analysis', () => {
    const mockScriptContent = `
      const myArrowMethod = () => {}
      function myFuncDeclMethod() {}
      const myLocal = 123
    `
    const mockScriptBlock = {
      // Note: All three are marked as SETUP_CONST by the Vue compiler.
      // Our analyzer must look at the AST to tell them apart.
      bindings: {
        myArrowMethod: BindingTypes.SETUP_CONST,
        myFuncDeclMethod: BindingTypes.SETUP_CONST,
        myLocal: BindingTypes.SETUP_CONST,
      },
    } as unknown as SFCScriptBlock

    const result = analyzeScript(mockScriptBlock, mockScriptContent)

    // Check methods
    expect(result.methods.size).toBe(2)
    expect(result.methods.has('myArrowMethod')).toBe(true)
    expect(result.methods.has('myFuncDeclMethod')).toBe(true)

    // Check local state
    expect(result.localState.size).toBe(1)
    expect(result.localState.has('myLocal')).toBe(true)

    // Ensure no cross-contamination
    expect(result.methods.has('myLocal')).toBe(false)
    expect(result.localState.has('myArrowMethod')).toBe(false)
  })

  it('should identify store variables from storeToRefs and prioritize them over refs', () => {
    const mockScriptContent = `
      import { storeToRefs } from 'pinia'
      import { useUserStore } from './userStore'
      import { ref } from 'vue'
      const { name, isAdmin } = storeToRefs(useUserStore())
      const someOtherRef = ref(false)
    `
    const mockScriptBlock = {
      // Note: storeToRefs creates refs, so compileScript reports them as SETUP_REF.
      // Our AST pass must correctly identify them as store variables and give them priority.
      bindings: {
        name: BindingTypes.SETUP_REF,
        isAdmin: BindingTypes.SETUP_REF,
        someOtherRef: BindingTypes.SETUP_REF,
      },
    } as unknown as SFCScriptBlock

    const result = analyzeScript(mockScriptBlock, mockScriptContent)

    // Check that store variables are correctly identified.
    expect(result.store.size).toBe(2)
    expect(result.store.has('name')).toBe(true)
    expect(result.store.has('isAdmin')).toBe(true)

    // Check that the regular ref is still identified correctly.
    expect(result.ref.size).toBe(1)
    expect(result.ref.has('someOtherRef')).toBe(true)

    // Crucially, ensure the store variables were NOT classified as refs.
    expect(result.ref.has('name')).toBe(false)
    expect(result.ref.has('isAdmin')).toBe(false)
  })

  describe('defineEmits', () => {
    it('should identify the "emit" function when assigned to a variable', () => {
      const mockScriptContent = `const emit = defineEmits(['update:modelValue'])`
      const mockScriptBlock = {
        bindings: {
          emit: BindingTypes.SETUP_CONST,
        },
      } as unknown as SFCScriptBlock

      const result = analyzeScript(mockScriptBlock, mockScriptContent)

      expect(result.emits.size).toBe(1)
      expect(result.emits.has('emit')).toBe(true)
      expect(result.localState.has('emit')).toBe(false)
    })

    it('should identify the implicit "emit" function when not assigned', () => {
      const mockScriptContent = `defineEmits(['some-event'])`
      const mockScriptBlock = {
        bindings: {},
      } as unknown as SFCScriptBlock

      const result = analyzeScript(mockScriptBlock, mockScriptContent)

      expect(result.emits.size).toBe(1)
      expect(result.emits.has('emit')).toBe(true)
    })
  })

  describe('passthrough identifiers', () => {
    it('should identify variables from useAttrs() and useSlots()', () => {
      const mockScriptContent = `
        const attrs = useAttrs()
        const slots = useSlots()
      `
      const mockScriptBlock = {
        // The Vue compiler sees these as plain constants.
        // Our AST pass is responsible for identifying their special nature.
        bindings: {
          attrs: BindingTypes.SETUP_CONST,
          slots: BindingTypes.SETUP_CONST,
        },
      } as unknown as SFCScriptBlock

      const result = analyzeScript(mockScriptBlock, mockScriptContent)

      expect(result.passthrough.size).toBe(2)
      expect(result.passthrough.has('attrs')).toBe(true)
      expect(result.passthrough.has('slots')).toBe(true)

      // Ensure they were not misclassified as simple local state.
      expect(result.localState.has('attrs')).toBe(false)
      expect(result.localState.has('slots')).toBe(false)
    })
  })
})
