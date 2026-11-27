import { describe, expect, it } from 'vitest'
import { resolveTheme } from './theme.js'

describe('resolveTheme', () => {
  it('returns light when preference is light regardless of system setting', () => {
    expect(resolveTheme('light', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
  })

  it('returns dark when preference is dark regardless of system setting', () => {
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('dark', true)).toBe('dark')
  })

  it('follows the system preference when preference is system', () => {
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('system', true)).toBe('dark')
  })

  it('falls back to the system preference for unknown or unset values', () => {
    expect(resolveTheme(undefined, false)).toBe('light')
    expect(resolveTheme(null, true)).toBe('dark')
    expect(resolveTheme('invalid', true)).toBe('dark')
  })
})
