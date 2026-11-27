export const DEFAULT_TIME_ZONE = 'Asia/Kolkata'
export const WEEK_START_DAY = 'Monday'

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
