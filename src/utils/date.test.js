import { describe, expect, it } from 'vitest'
import {
  WEEKDAY_KEYS,
  WEEK_START_DAY,
  WEEK_START_KEY,
  formatLocalDate,
  getWeekdayKeyFromDateKey,
  parseDateKey,
  weekdayFromJsDay,
} from './date.js'

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

describe('weekday constants', () => {
  it('defines weekday keys ordered Monday first and unified week start', () => {
    expect(WEEKDAY_KEYS).toEqual([
      'mon',
      'tue',
      'wed',
      'thu',
      'fri',
      'sat',
      'sun',
    ])
    expect(WEEK_START_KEY).toBe('mon')
    expect(WEEK_START_DAY).toBe('Monday')
  })
})

describe('weekdayFromJsDay', () => {
  it('converts 0..6 (Sunday..Saturday) to weekday keys', () => {
    expect(weekdayFromJsDay(0)).toBe('sun')
    expect(weekdayFromJsDay(1)).toBe('mon')
    expect(weekdayFromJsDay(2)).toBe('tue')
    expect(weekdayFromJsDay(3)).toBe('wed')
    expect(weekdayFromJsDay(4)).toBe('thu')
    expect(weekdayFromJsDay(5)).toBe('fri')
    expect(weekdayFromJsDay(6)).toBe('sat')
  })

  it('throws on out-of-range or non-integer values', () => {
    expect(() => weekdayFromJsDay(-1)).toThrow()
    expect(() => weekdayFromJsDay(7)).toThrow()
    expect(() => weekdayFromJsDay(1.5)).toThrow()
    expect(() => weekdayFromJsDay(Number.NaN)).toThrow()
    expect(() => weekdayFromJsDay('1')).toThrow()
    expect(() => weekdayFromJsDay(null)).toThrow()
    expect(() => weekdayFromJsDay(undefined)).toThrow()
  })
})

describe('getWeekdayKeyFromDateKey & parseDateKey', () => {
  it('returns the weekday key for known dates, year boundary, and leap day', () => {
    expect(getWeekdayKeyFromDateKey('2026-11-27')).toBe('fri')
    expect(getWeekdayKeyFromDateKey('2025-12-31')).toBe('wed')
    expect(getWeekdayKeyFromDateKey('2026-01-01')).toBe('thu')
    expect(getWeekdayKeyFromDateKey('2028-02-29')).toBe('tue')
    expect(getWeekdayKeyFromDateKey('2000-02-29')).toBe('tue')
  })

  it('throws on malformed or impossible date keys', () => {
    expect(() => parseDateKey('2026-02-30')).toThrow()
    expect(() => parseDateKey('2026-02-29')).toThrow()
    expect(() => parseDateKey('2026-04-31')).toThrow()
    expect(() => parseDateKey('2026-13-01')).toThrow()
    expect(() => parseDateKey('2026-00-10')).toThrow()
    expect(() => parseDateKey('2026-01-00')).toThrow()
    expect(() => getWeekdayKeyFromDateKey('2026/11/27')).toThrow()
    expect(() => getWeekdayKeyFromDateKey('26-11-27')).toThrow()
    expect(() => getWeekdayKeyFromDateKey('')).toThrow()
    expect(() => getWeekdayKeyFromDateKey(null)).toThrow()
  })
})
