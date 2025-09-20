import type {
  ExportDefaultDeclaration,
  Identifier,
  Node,
  ObjectExpression,
  ObjectMethod,
  Program,
} from '@babel/types'

/**
 *  Analyzes import statements to find aliases for Vue reactivity functions.
 * @param scriptAst The Program node of the script.
 * @returns A map where the key is the local alias and the value is the original name
 * (e.g., { vueRef: 'ref', R: 'reactive' }).
 */
export function analyzeVueImports(scriptAst: Program): Map<string, string> {
  const importMap = new Map<string, string>()
  const VUE_REACTIVITY_APIS = new Set(['ref', 'reactive', 'computed'])

  for (const node of scriptAst.body) {
    if (node.type === 'ImportDeclaration' && node.source.value === 'vue') {
      for (const specifier of node.specifiers) {
        if (specifier.type === 'ImportSpecifier') {
          const importedName = (specifier.imported as Identifier).name
          if (VUE_REACTIVITY_APIS.has(importedName)) {
            const localName = specifier.local.name
            importMap.set(localName, importedName)
          }
        }
      }
    }
  }
  return importMap
}

/**
 * Safely gets the string name of a property key from an AST node.
 * @param node The key node (Identifier or StringLiteral).
 * @returns The name of the key or undefined if it's a complex expression.
 */
export function getNodeKeyName(node: Node): string | undefined {
  if (node.type === 'Identifier')
    return node.name
  if (node.type === 'StringLiteral')
    return node.value
}

/**
 * Finds the main ObjectExpression that defines a Vue component.
 * Handles `export default {}` and `export default defineComponent({})`.
 * @param scriptAst The Program node of the script.
 * @returns The ObjectExpression node or null if not found.
 */
export function findComponentDefinition(scriptAst: Program): ObjectExpression | null {
  const exportDefault = scriptAst.body.find(
    node => node.type === 'ExportDefaultDeclaration',
  ) as ExportDefaultDeclaration | undefined

  if (!exportDefault)
    return null

  if (exportDefault.declaration.type === 'ObjectExpression')
    return exportDefault.declaration

  if (
    exportDefault.declaration.type === 'CallExpression'
    && (exportDefault.declaration.callee as Identifier).name === 'defineComponent'
    && exportDefault.declaration.arguments[0]?.type === 'ObjectExpression'
  ) {
    return exportDefault.declaration.arguments[0]
  }

  return null
}

/**
 * Finds the setup() method node within a component definition.
 * @param componentDef The ObjectExpression node of the component.
 * @returns The ObjectMethod node for setup() or undefined if not found.
 */
export function findSetupMethod(componentDef: ObjectExpression): ObjectMethod | undefined {
  const setupProperty = componentDef.properties.find((prop) => {
    return (
      (prop.type === 'ObjectProperty' || prop.type === 'ObjectMethod')
      && !prop.computed
      && getNodeKeyName(prop.key) === 'setup'
    )
  })

  if (setupProperty && setupProperty.type === 'ObjectMethod') {
    return setupProperty
  }
  // Could also handle `setup: function() {}` (ObjectProperty with FunctionExpression)
  // but ObjectMethod is the most common case. We can extend this later if needed.
}
