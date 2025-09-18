import type {
  ExportDefaultDeclaration,
  Identifier,
  Node,
  ObjectExpression,
  Program,
} from '@babel/types'

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
