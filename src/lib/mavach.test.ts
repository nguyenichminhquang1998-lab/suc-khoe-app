import { describe, expect, it } from 'vitest'
import { doKhoiLuongGoi } from './mavach'

describe('doKhoiLuongGoi', () => {
  it('đọc gam', () => {
    expect(doKhoiLuongGoi('100g')).toBe(100)
    expect(doKhoiLuongGoi('250 g')).toBe(250)
  })

  it('đọc mililit', () => {
    expect(doKhoiLuongGoi('330 ml')).toBe(330)
  })

  it('quy đổi kg và lít sang gam/ml', () => {
    expect(doKhoiLuongGoi('1.5 L')).toBe(1500)
    expect(doKhoiLuongGoi('2 kg')).toBe(2000)
  })

  it('chấp nhận dấu phẩy thập phân kiểu Việt Nam', () => {
    expect(doKhoiLuongGoi('1,5 L')).toBe(1500)
  })

  it('trả về undefined khi không đọc được', () => {
    expect(doKhoiLuongGoi(undefined)).toBeUndefined()
    expect(doKhoiLuongGoi('hộp lớn')).toBeUndefined()
    expect(doKhoiLuongGoi('')).toBeUndefined()
  })
})
