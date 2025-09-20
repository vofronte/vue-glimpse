import { parse } from '@vue/compiler-sfc'
import { analyzeOptionsApi } from '../../src/parser/optionsApi/analyzer.js'

describe('optionsApiAnalyzer', () => {
  it('should correctly identify all categories in a comprehensive Options API component', () => {
    const mockOptionsApiScriptContent = `
      <script lang="ts">
      import { defineComponent } from 'vue'

      const useUserStore = () => ({
        theme: 'dark',
        role: 'Admin',
        // Mock action
        updateTheme(newTheme: string) { console.log(newTheme) },
      })

      function mapState(store: any, keys: string[]) {
        const mapped = {} as any
        for (const key of keys) mapped[key] = function () { return store[key] }
        return mapped
      }

      function mapActions(store: any, keys: string[]) {
        const mapped = {} as any
        for (const key of keys) mapped[key] = function (...args: any[]) { (store as any)[key](...args) }
        return mapped
      }

      interface UserProfile { id: number; name: string; permissions: string[] }

      export default defineComponent({
        name: 'UserCardOptions',
        props: {
          user: { type: Object as () => UserProfile, required: true },
        },
        data() {
          return {
            state: { isActive: true },
            visitCount: 0,
          }
        },
        computed: {
          displayName(): string {
            return \`User: \${this.user.name.toUpperCase()}\`
          },
          ...mapState(useUserStore(), ['theme', 'role']),
        },
        methods: {
          updateVisits() { this.visitCount++ },
          ...mapActions(useUserStore(), ['updateTheme']),
        },
      })
      </script>
    `
    const { descriptor } = parse(mockOptionsApiScriptContent)
    const result = analyzeOptionsApi(descriptor)

    expect(result).not.toBeNull()
    const ids = result!.scriptIdentifiers

    // Props
    expect(ids.props.has('user')).toBe(true)
    // Data (as Reactive)
    expect(ids.reactive.has('state')).toBe(true)
    // Ref (from setup) - assertion
    expect(ids.reactive.has('visitCount')).toBe(true)
    // Computed
    expect(ids.computed.has('displayName')).toBe(true)
    // Methods
    expect(ids.methods.size).toBe(2) // updateVisits + updateTheme
    expect(ids.methods.has('updateVisits')).toBe(true)
    expect(ids.methods.has('updateTheme')).toBe(true)
    // Store (from ...mapState)
    expect(ids.store.size).toBe(2)
    expect(ids.store.has('theme')).toBe(true)
    expect(ids.store.has('role')).toBe(true)
    // localConstant from setup should not be present
    expect(ids.localState.has('localConstant')).toBe(false)
  })

  it('should correctly identify simple bindings from setup() in Options API', () => {
    const mockScriptContent = `
      <script lang="ts">
      import { defineComponent, ref, reactive, computed } from 'vue'

      export default defineComponent({
        setup() {
          const count = ref(0)
          const state = reactive({ id: 1 })
          const double = computed(() => count.value * 2)
          const localConstant = 100
          const myMethod = () => {}

          // This one is too complex and should be ignored
          let complexVar
          if (true) { complexVar = ref(100) }

          return { count, state, double, localConstant, myMethod, complexVar }
        }
      })
      </script>
    `
    const { descriptor } = parse(mockScriptContent)
    const result = analyzeOptionsApi(descriptor)

    expect(result).not.toBeNull()
    const ids = result!.scriptIdentifiers

    // 1. Correctly identified types
    expect(ids.ref.has('count')).toBe(true)

    expect(ids.reactive.has('state')).toBe(true)

    expect(ids.computed.has('double')).toBe(true)

    // Check for local constant

    expect(ids.localState.has('localConstant')).toBe(true)

    // Check for method
    expect(ids.methods.has('myMethod')).toBe(true)

    // 2. Ignored uncertain types
    expect(ids.ref.has('complexVar')).toBe(false)
  })

  it('should handle aliased imports for reactivity APIs in setup()', () => {
    const mockScriptContent = `
      <script lang="ts">
      import { defineComponent, ref as vueRef, reactive as R } from 'vue'

      export default defineComponent({
        setup() {
          const count = vueRef(0)
          const state = R({ id: 1 })

          return { count, state }
        }
      })
      </script>
    `
    const { descriptor } = parse(mockScriptContent)
    const result = analyzeOptionsApi(descriptor)

    expect(result).not.toBeNull()
    const ids = result!.scriptIdentifiers

    expect(ids.ref.has('count')).toBe(true)
    expect(ids.reactive.has('state')).toBe(true)
  })
})
