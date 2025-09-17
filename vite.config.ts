import { builtinModules } from 'node:module'
import process from 'node:process'
import { defineConfig } from 'vitest/config'

const builtins = builtinModules.filter(m => !m.startsWith('_'))
const builtinsWithNodePrefix = builtins.map(m => `node:${m}`)

// https://vitejs.dev/config/
export default defineConfig({
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
    rollupOptions: {
      external: [
        'vscode',
        ...builtins,
        ...builtinsWithNodePrefix,
      ],
    },
    target: 'node16',
    minify: process.env.NODE_ENV === 'production',
    sourcemap: true,
  },
})
