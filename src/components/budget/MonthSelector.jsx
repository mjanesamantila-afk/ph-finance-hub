import { monthOptionsForYear, currentYear } from '../../lib/dates'

export default function MonthSelector({ value, onChange }) {
  const options = monthOptionsForYear()
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label} {currentYear()}
        </option>
      ))}
    </select>
  )
}
