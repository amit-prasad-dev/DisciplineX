export const DEFAULT_TIME_ZONE = 'Asia/Kolkata'

export const WEEKDAY_KEYS = Object.freeze([
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
])

const WEEKDAY_LABELS = Object.freeze({
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
})

export const WEEK_START_KEY = WEEKDAY_KEYS[0]
export const WEEK_START_DAY = WEEKDAY_LABELS[WEEK_START_KEY]

const JS_DAY_TO_WEEKDAY_KEY = Object.freeze([
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
])

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const SAKAMOTO_OFFSETS = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function getDaysInMonth(year, month) {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28
  }
  if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30
  }
  return 31
}

/**
 * Parse and validate a YYYY-MM-DD calendar date key without using timestamps
 * or local time zones. Throws a clear Error on malformed or impossible dates.
 */
export function parseDateKey(dateKey) {
  if (typeof dateKey !== 'string') {
    throw new Error(`Invalid date key: expected string, got ${typeof dateKey}`)
  }

  const match = DATE_KEY_PATTERN.exec(dateKey)
  if (!match) {
    throw new Error(`Invalid date key format: "${dateKey}" (expected YYYY-MM-DD)`)
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (month < 1 || month > 12) {
    throw new Error(`Invalid month in date key: "${dateKey}"`)
  }

  const maxDay = getDaysInMonth(year, month)
  if (day < 1 || day > maxDay) {
    throw new Error(`Invalid calendar day in date key: "${dateKey}"`)
  }

  return { year, month, day }
}

/**
 * Convert a JavaScript Date.getDay() value (0 = Sunday .. 6 = Saturday)
 * into a DisciplineX weekday key ('mon'..'sun').
 */
export function weekdayFromJsDay(jsDay) {
  if (!Number.isInteger(jsDay) || jsDay < 0 || jsDay > 6) {
    throw new Error(
      `Invalid weekday index: ${String(jsDay)} (expected integer 0..6)`,
    )
  }
  return JS_DAY_TO_WEEKDAY_KEY[jsDay]
}

/**
 * Return the weekday key ('mon'..'sun') for a YYYY-MM-DD calendar date key
 * using pure Gregorian calendar arithmetic from its (year, month, day) parts.
 */
export function getWeekdayKeyFromDateKey(dateKey) {
  const { year, month, day } = parseDateKey(dateKey)
  const adjustedYear = month < 3 ? year - 1 : year
  const jsDay =
    (adjustedYear +
      Math.floor(adjustedYear / 4) -
      Math.floor(adjustedYear / 100) +
      Math.floor(adjustedYear / 400) +
      SAKAMOTO_OFFSETS[month - 1] +
      day) %
    7
  return weekdayFromJsDay(jsDay)
}

/**
 * Return a YYYY-MM-DD local date key for `date` in `timeZone` using
 * Intl.DateTimeFormat.formatToParts (year, month, and day parts only).
 */
export function getLocalDateKey(
  date = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  let year
  let month
  let day

  for (const part of parts) {
    if (part.type === 'year') {
      year = part.value
    } else if (part.type === 'month') {
      month = part.value
    } else if (part.type === 'day') {
      day = part.value
    }
  }

  return `${year}-${month}-${day}`
}

/**
 * Format a Date for display in the specified IANA time zone using Intl.
 * Accepts a Date parameter for deterministic testing and avoids UTC slicing.
 */
export function formatLocalDate(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}
