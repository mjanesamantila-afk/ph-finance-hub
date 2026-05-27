import { calendarWeeks, clampDay, WEEKDAY_LABELS } from '../../lib/dates'
import { formatMoney } from '../../lib/finance'

// Month calendar with bills shown on their due day.
export default function BillCalendar({ year, monthIndex, bills, onSelectBill }) {
  const weeks = calendarWeeks(year, monthIndex)

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex
  const todayDate = today.getDate()

  // Map day-of-month -> bills due that day (clamped to month length).
  const byDay = {}
  for (const b of bills) {
    if (b.active === false) continue
    const day = clampDay(year, monthIndex, b.due_day)
    ;(byDay[day] ||= []).push(b)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (day === null) return <div key={di} className="min-h-16 rounded-lg" />
              const dayBills = byDay[day] || []
              const isToday = isCurrentMonth && day === todayDate
              return (
                <div
                  key={di}
                  className={`min-h-16 rounded-lg border p-1 text-left ${
                    isToday ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100'
                  }`}
                >
                  <div
                    className={`text-xs font-medium ${
                      isToday ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {day}
                  </div>
                  <div className="mt-0.5 space-y-0.5">
                    {dayBills.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => onSelectBill(b)}
                        className="block w-full truncate rounded bg-rose-100 px-1 py-0.5 text-left text-[10px] font-medium text-rose-700 hover:bg-rose-200"
                        title={`${b.name}${b.amount ? ` — ${formatMoney(b.amount)}` : ''}`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
