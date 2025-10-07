import { resolveAccountErrorStatus } from '../employees.routes'

describe('resolveAccountErrorStatus', () => {
  it('returns 404 for not found keyword', () => {
    expect(resolveAccountErrorStatus('Account not found')).toBe(404)
    expect(resolveAccountErrorStatus('User does not exist')).toBe(404)
  })

  it('returns 400 for invalid format keyword', () => {
    expect(resolveAccountErrorStatus('Username format invalid')).toBe(400)
    expect(resolveAccountErrorStatus('Invalid username format')).toBe(400)
  })

  it('returns 409 for duplicate keyword', () => {
    expect(resolveAccountErrorStatus('Username already exists')).toBe(409)
    expect(resolveAccountErrorStatus('Duplicate username detected')).toBe(409)
  })

  it('defaults to 400 when keyword not matched', () => {
    expect(resolveAccountErrorStatus('unexpected error')).toBe(400)
  })
})
