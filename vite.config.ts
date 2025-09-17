import { builtinModules } from 'node:module'
import { defineConfig } from 'vitest/config'

const nodeBuiltins = builtinModules.filter(m => !m.startsWith('_'))

const devExternal = [
  '@vue/compiler-sfc',
  '@vue/compiler-dom',
  'typescript',
]

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    test: {
      globals: true,
      environment: 'node',
      include: ['tests/**/*.test.ts'],
    },
    build: {
      outDir: 'out',
      emptyOutDir: true,
      lib: {
        entry: 'src/extension.ts',
        formats: ['cjs'],
        fileName: 'extension',
      },
      sourcemap: !isProduction,
      minify: isProduction,
      rollupOptions: {
        external: [
          'vscode',
          ...nodeBuiltins,
          ...nodeBuiltins.map(m => `node:${m}`),
          ...(isProduction ? [] : devExternal),
        ],
      },
      target: 'node16',
    },
  }
})
