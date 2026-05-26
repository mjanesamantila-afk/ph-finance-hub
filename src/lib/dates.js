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

export function monthLabel(monthKey) {
  const idx = Number((monthKey || '').slice(5, 7)) - 1
  return MONTH_NAMES[idx] ?? monthKey
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
