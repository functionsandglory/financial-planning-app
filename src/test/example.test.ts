import { describe, it, expect } from 'vitest'

describe('Setup Check', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true)
  })

  it('should handle math', () => {
    expect(2 + 2).toBe(4)
  })
})
