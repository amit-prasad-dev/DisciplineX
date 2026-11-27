import { describe, expect, it } from 'vitest'
import { formatLocalDate } from './date.js'

describe('formatLocalDate', () => {
  it('formats a fixed date in Asia/Kolkata by default', () => {
    const noonUtc = new Date('2026-11-27T12:00:00Z')
    expect(formatLocalDate(noonUtc)).toBe('Friday, November 27, 2026')
  })

  it('handles UTC near-midnight instants where UTC and Asia/Kolkata differ', () => {
    // 20:30 UTC on Nov 26 is 02:00 on Nov 27 in Asia/Kolkata (UTC+05:30).
    const lateUtc = new Date('2026-11-26T20:30:00Z')
    expect(formatLocalDate(lateUtc, 'UTC')).toBe('Thursday, November 26, 2026')
    expect(formatLocalDate(lateUtc, 'Asia/Kolkata')).toBe(
      'Friday, November 27, 2026',
    )
  })

  it('handles the exact 00:00 Asia/Kolkata boundary (18:30 UTC)', () => {
    const justBeforeIstMidnight = new Date('2026-11-26T18:29:59Z')
    const atIstMidnight = new Date('2026-11-26T18:30:00Z')

    expect(formatLocalDate(justBeforeIstMidnight, 'Asia/Kolkata')).toBe(
      'Thursday, November 26, 2026',
    )
    expect(formatLocalDate(atIstMidnight, 'Asia/Kolkata')).toBe(
      'Friday, November 27, 2026',
    )
  })

  it('formats for other IANA time zones accurately', () => {
    const earlyUtc = new Date('2026-11-27T04:00:00Z')
    expect(formatLocalDate(earlyUtc, 'America/New_York')).toBe(
      'Thursday, November 26, 2026',
    )
    expect(formatLocalDate(earlyUtc, 'Asia/Kolkata')).toBe(
      'Friday, November 27, 2026',
    )
  })
})
