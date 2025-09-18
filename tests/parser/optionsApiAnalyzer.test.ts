import { parse } from '@vue/compiler-sfc'
import { analyzeOptionsApi } from '../../src/parser/optionsApi/analyzer.js'

describe('optionsApiAnalyzer', () => {
  it('should correctly identify all categories in a comprehensive Options API component', () => {
    const mockOptionsApiScriptContent = `
      <script lang="ts">
      import { defineComponent, reactive } from 'vue'

      const useUserStore = () => ({
        theme: 'dark',
        role: 'Admin',
        // Mock action
        updateTheme(newTheme: string) { console.log(newTheme) }
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
    // We use the real `parse` to get a realistic descriptor
    const { descriptor } = parse(mockOptionsApiScriptContent)
    const result = analyzeOptionsApi(descriptor)

    expect(result).not.toBeNull()
    const ids = result!.scriptIdentifiers

    // Props
    expect(ids.props.has('user')).toBe(true)
    // Data (as Reactive)
    expect(ids.reactive.has('state')).toBe(true)
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
  })
})
