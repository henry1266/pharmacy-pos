import { resolveAccountErrorStatus } from '../employees.routes'

describe('resolveAccountErrorStatus', () => {
  it('returns 404 for not found keyword', () => {
    expect(resolveAccountErrorStatus('找不到該員工帳號資料')).toBe(404)
    expect(resolveAccountErrorStatus('尚未建立帳號')).toBe(404)
  })

  it('returns 400 for invalid format keyword', () => {
    expect(resolveAccountErrorStatus('無效的員工ID格式')).toBe(400)
    expect(resolveAccountErrorStatus('Invalid username format')).toBe(400)
  })

  it('returns 400 for duplicate keyword', () => {
    expect(resolveAccountErrorStatus('該帳號已被使用')).toBe(400)
    expect(resolveAccountErrorStatus('Username duplicate')).toBe(400)
  })

  it('defaults to 400 when keyword not matched', () => {
    expect(resolveAccountErrorStatus('unexpected error')).toBe(400)
  })
})
