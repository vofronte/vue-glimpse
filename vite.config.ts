import process from 'node:process'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
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
        '@vue/compiler-sfc',
        '@vue/compiler-dom',
        'typescript',
        /^node:/,
      ],
    },
    target: 'node16',
    minify: process.env.NODE_ENV === 'production',
    sourcemap: true,
  },
})
