import { parse as babelParse } from '@babel/parser'
import { createSourceFile, ScriptTarget } from 'typescript'
import { analyzeImports } from '../../../src/parser/utils/importAnalyzer.js'

describe('importAnalyzer', () => {
  describe('typeScript AST', () => {
    it('should detect pinia import', () => {
      const code = `import { createPinia } from 'pinia'`
      const ast = createSourceFile('test.ts', code, ScriptTarget.Latest, true)
      const result = analyzeImports(ast)
      expect(result.hasPinia).toBe(true)
      expect(result.hasVuex).toBe(false)
    })

    it('should detect vuex import', () => {
      const code = `import { createStore } from 'vuex'`
      const ast = createSourceFile('test.ts', code, ScriptTarget.Latest, true)
      const result = analyzeImports(ast)
      expect(result.hasPinia).toBe(false)
      expect(result.hasVuex).toBe(true)
    })

    it('should return false for unrelated imports', () => {
      const code = `import { ref } from 'vue'`
      const ast = createSourceFile('test.ts', code, ScriptTarget.Latest, true)
      const result = analyzeImports(ast)
      expect(result.hasPinia).toBe(false)
      expect(result.hasVuex).toBe(false)
    })
  })

  describe('babel AST', () => {
    it('should detect pinia import', () => {
      const code = `import { createPinia } from 'pinia'`
      // Access the .program property
      const ast = babelParse(code, { sourceType: 'module' }).program
      const result = analyzeImports(ast)
      expect(result.hasPinia).toBe(true)
      expect(result.hasVuex).toBe(false)
    })

    it('should detect vuex import', () => {
      const code = `import { createStore } from 'vuex'`
      // Access the .program property
      const ast = babelParse(code, { sourceType: 'module' }).program
      const result = analyzeImports(ast)
      expect(result.hasPinia).toBe(false)
      expect(result.hasVuex).toBe(true)
    })

    it('should return false for unrelated imports', () => {
      const code = `import { ref } from 'vue'`
      // Access the .program property
      const ast = babelParse(code, { sourceType: 'module' }).program
      const result = analyzeImports(ast)
      expect(result.hasPinia).toBe(false)
      expect(result.hasVuex).toBe(false)
    })
  })
})
