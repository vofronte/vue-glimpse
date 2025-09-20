import { describe, expect, it } from 'vitest'
import { DEFAULT_CATEGORY_ICONS, generateIconMap } from '../src/categoryConfig.js'

describe('categoryConfig: generateIconMap', () => {
  it('should return default icons when no overrides are provided', () => {
    const result = generateIconMap(DEFAULT_CATEGORY_ICONS, {})
    expect(result).toEqual(DEFAULT_CATEGORY_ICONS)
  })

  it('should override specified icons correctly', () => {
    const overrides = {
      props: '🎁',
      ref: 'R',
    }
    const result = generateIconMap(DEFAULT_CATEGORY_ICONS, overrides)

    // Check that overrides were applied
    expect(result.props).toBe('🎁')
    expect(result.ref).toBe('R')

    // Check that other icons remain default
    expect(result.computed).toBe(DEFAULT_CATEGORY_ICONS.computed)
    expect(result.store).toBe(DEFAULT_CATEGORY_ICONS.store)
  })

  it('should handle overriding an icon with an empty string', () => {
    const overrides = {
      props: '',
    }
    const result = generateIconMap(DEFAULT_CATEGORY_ICONS, overrides)
    expect(result.props).toBe('')
  })

  it('should ignore invalid override keys that are not part of the categories', () => {
    const overrides = {
      props: 'P',
      nonExistentCategory: '❌',
    }
    const result = generateIconMap(DEFAULT_CATEGORY_ICONS, overrides)

    // The valid override should apply
    expect(result.props).toBe('P')

    // The result object should not contain the invalid key
    expect(result).not.toHaveProperty('nonExistentCategory')
  })

  it('should not modify the original default icons object', () => {
    const overrides = { props: 'MODIFIED' }
    generateIconMap(DEFAULT_CATEGORY_ICONS, overrides)

    // Ensure the original constant was not mutated (important for pure functions)
    expect(DEFAULT_CATEGORY_ICONS.props).not.toBe('MODIFIED')
    expect(DEFAULT_CATEGORY_ICONS.props).toBe('℗')
  })
})
