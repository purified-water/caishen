/** Today's date as YYYY-MM-DD in the local timezone. */
export function todayDateString(): string {
  const d = new Date()
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 10)
}

/** Formats a Date/ISO string as YYYY-MM. */
export function toMonthKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Converts a YYYY-MM key to the 1st-of-month date string (YYYY-MM-DD). */
export function monthKeyToDate(monthKey: string): string {
  return `${monthKey}-01`
}

export function nextMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month, 1)) // month is 0-indexed target = +1
  return toMonthKey(date)
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
