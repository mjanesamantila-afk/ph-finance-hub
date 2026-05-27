export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function currentYear() {
  return new Date().getFullYear()
}

// All 12 months of the given year as { value: 'YYYY-MM', label: 'January' }.
export function monthOptionsForYear(year = currentYear()) {
  return MONTH_NAMES.map((name, i) => ({
    value: `${year}-${String(i + 1).padStart(2, '0')}`,
    label: name,
  }))
}

export function currentMonthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// 'YYYY-MM-DD' -> 'YYYY-MM'
export function monthKeyOf(dateStr) {
  return (dateStr || '').slice(0, 7)
}

// Date object -> 'YYYY-MM'
export function monthKeyFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(monthKey) {
  const idx = Number((monthKey || '').slice(5, 7)) - 1
  return MONTH_NAMES[idx] ?? monthKey
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

// ---- Recurring monthly due-date helpers -------------------------------------
// Clamp a day-of-month to the actual last day (e.g. 31 -> 28/29/30).
export function clampDay(year, monthIndex, day) {
  const last = new Date(year, monthIndex + 1, 0).getDate()
  return Math.min(Math.max(Number(day) || 1, 1), last)
}

// Next occurrence (today or later) of a monthly due day.
export function nextDueDate(dueDay, from = new Date()) {
  const y = from.getFullYear()
  const m = from.getMonth()
  const today = new Date(y, m, from.getDate())
  const thisMonth = new Date(y, m, clampDay(y, m, dueDay))
  if (thisMonth >= today) return thisMonth
  const nm = (m + 1) % 12
  const ny = m === 11 ? y + 1 : y
  return new Date(ny, nm, clampDay(ny, nm, dueDay))
}

// Whole days from `from` until `date` (0 = today, negative = past).
export function daysUntil(date, from = new Date()) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((b - a) / 86400000)
}

// Calendar grid (array of weeks; each week is 7 cells, null = padding) for a
// given year + month index (0-11).
export function calendarWeeks(year, monthIndex) {
  const firstWeekday = new Date(year, monthIndex, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
