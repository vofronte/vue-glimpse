import { parse } from '@vue/compiler-sfc'
import { analyzeOptionsApi } from '../../src/parser/optionsApi/analyzer.js'

describe('optionsApiAnalyzer', () => {
  it('should correctly identify all categories in a comprehensive Options API component', () => {
    const mockOptionsApiScriptContent = `
      <script lang="ts">
      import { defineComponent, reactive } from 'vue'

      const useUserStore = () => reactive({ theme: 'dark', role: 'Admin' })
      function mapState(store: any, keys: string[]) {
        const mapped = {} as any
        for (const key of keys) mapped[key] = function () { return store[key] }
        return mapped
      }

      interface UserProfile { id: number; name: string; permissions: string[] }

      export default defineComponent({
        name: 'UserCardOptions',
        props: {
          user: { type: Object as () => UserProfile, required: true },
          initialVisits: { type: Number, default: 0 },
        },
        emits: ['promoted'],
        data() {
          return {
            state: { lastLogin: new Date().toLocaleDateString(), isActive: true },
            visitCount: this.initialVisits,
          }
        },
        computed: {
          displayName(): string {
            return \`User: \${this.user.name.toUpperCase()}\`
          },
          ...mapState(useUserStore(), ['theme', 'role']),
          isAdmin(): boolean {
            // @ts-expect-error
            return this.role === 'Admin'
          }
        },
        methods: {
          updateVisits() { this.visitCount++ },
          resetState() { this.state.isActive = false },
          promoteUser() { this.$emit('promoted', this.user.id) },
        },
      })
      </script>
    `
    // We use the real `parse` to get a realistic descriptor
    const { descriptor } = parse(mockOptionsApiScriptContent)

    const result = analyzeOptionsApi(descriptor)

    expect(result).not.toBeNull()
    const ids = result!.scriptIdentifiers

    // 1. Props
    expect(ids.props.size).toBe(2)
    expect(ids.props.has('user')).toBe(true)
    expect(ids.props.has('initialVisits')).toBe(true)

    // 2. Data (as Reactive)
    expect(ids.reactive.size).toBe(2)
    expect(ids.reactive.has('state')).toBe(true)
    expect(ids.reactive.has('visitCount')).toBe(true)

    // 3. Computed
    expect(ids.computed.size).toBe(2)
    expect(ids.computed.has('displayName')).toBe(true)
    expect(ids.computed.has('isAdmin')).toBe(true)

    // 4. Methods
    expect(ids.methods.size).toBe(3)
    expect(ids.methods.has('updateVisits')).toBe(true)
    expect(ids.methods.has('resetState')).toBe(true)
    expect(ids.methods.has('promoteUser')).toBe(true)

    // 5. Store (from ...mapState)
    expect(ids.store.size).toBe(2)
    expect(ids.store.has('theme')).toBe(true)
    expect(ids.store.has('role')).toBe(true)

    // 6. localState should be empty
    expect(ids.localState.size).toBe(0)

    // 7. No cross-contamination checks
    expect(ids.props.has('displayName')).toBe(false)
    expect(ids.reactive.has('user')).toBe(false)
    expect(ids.computed.has('visitCount')).toBe(false)
    expect(ids.methods.has('theme')).toBe(false)
  })
})
