/*
  This file is adapted from the official @vue/compiler-sfc package.
  We vendor it to safely use internal APIs that are not exposed publicly.
  Original source: https://github.com/vuejs/core/tree/main/packages/compiler-sfc
*/

import type { ArrayExpression, Node, ObjectExpression } from '@babel/types'
import type { BindingMetadata } from '../../types.js'
import { BindingTypes } from '@vue/compiler-dom'

// Helper function to resolve object keys, copied from @vue/compiler-sfc
function resolveObjectKey(node: Node, computed: boolean): string | undefined {
  switch (node.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
      return String(node.value)
    case 'Identifier':
      if (!computed)
        return node.name
  }
}

function getObjectExpressionKeys(node: ObjectExpression): string[] {
  const keys = []
  for (const prop of node.properties) {
    if (prop.type === 'SpreadElement')
      continue
    const key = resolveObjectKey(prop.key, prop.computed)
    if (key)
      keys.push(String(key))
  }
  return keys
}

function getArrayExpressionKeys(node: ArrayExpression): string[] {
  const keys = []
  for (const element of node.elements) {
    if (element && element.type === 'StringLiteral')
      keys.push(element.value)
  }
  return keys
}

function getObjectOrArrayExpressionKeys(value: Node): string[] {
  if (value.type === 'ArrayExpression')
    return getArrayExpressionKeys(value)

  if (value.type === 'ObjectExpression')
    return getObjectExpressionKeys(value)

  return []
}

/**
 * Analyze bindings from a component options object.
 * @param node The ObjectExpression node representing the component options.
 * @returns A binding metadata object.
 */
export function analyzeBindingsFromOptions(node: ObjectExpression): BindingMetadata {
  const bindings: BindingMetadata = {}
  // Mark as non-script-setup to avoid resolving components/directives from these bindings
  Object.defineProperty(bindings, '__isScriptSetup', {
    enumerable: false,
    value: false,
  })

  for (const property of node.properties) {
    if (
      property.type === 'ObjectProperty'
      && !property.computed
      && property.key.type === 'Identifier'
    ) {
      // props: ['foo'] or { foo: ... }
      if (property.key.name === 'props') {
        for (const key of getObjectOrArrayExpressionKeys(property.value))
          bindings[key] = BindingTypes.PROPS
      }
      // inject: ['foo'] or { foo: {} }
      else if (property.key.name === 'inject') {
        for (const key of getObjectOrArrayExpressionKeys(property.value))
          bindings[key] = BindingTypes.OPTIONS
      }
      // computed & methods
      else if (
        property.value.type === 'ObjectExpression'
        && (property.key.name === 'computed' || property.key.name === 'methods')
      ) {
        for (const key of getObjectExpressionKeys(property.value))
          bindings[key] = BindingTypes.OPTIONS
      }
    }
    // setup() & data()
    else if (
      property.type === 'ObjectMethod'
      && property.key.type === 'Identifier'
      && (property.key.name === 'setup' || property.key.name === 'data')
    ) {
      for (const bodyItem of property.body.body) {
        if (
          bodyItem.type === 'ReturnStatement'
          && bodyItem.argument
          && bodyItem.argument.type === 'ObjectExpression'
        ) {
          for (const key of getObjectExpressionKeys(bodyItem.argument)) {
            bindings[key]
              = property.key.name === 'setup'
                ? BindingTypes.SETUP_MAYBE_REF
                : BindingTypes.DATA
          }
        }
      }
    }
  }

  return bindings
}
