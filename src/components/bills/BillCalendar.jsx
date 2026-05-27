import { Check } from 'lucide-react'
import { calendarWeeks, clampDay, monthKeyFromDate, WEEKDAY_LABELS } from '../../lib/dates'
import { formatMoney } from '../../lib/finance'
import { effectiveAmount } from '../../lib/bills'

// Month calendar with bills shown on their due day.
// Tapping a bill toggles its paid status for THIS month only.
export default function BillCalendar({ year, monthIndex, bills, onTogglePaid }) {
  const weeks = calendarWeeks(year, monthIndex)
  const monthKey = monthKeyFromDate(new Date(year, monthIndex, 1))

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
                    {dayBills.map((b) => {
                      const paid = (b.paid_months || []).includes(monthKey)
                      return (
                        <button
                          key={b.id}
                          onClick={() => onTogglePaid(b, monthKey, !paid)}
                          className={`flex w-full items-center gap-0.5 truncate rounded px-1 py-0.5 text-left text-[10px] font-medium ${
                            paid
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          }`}
                          title={`${b.name} — ${formatMoney(effectiveAmount(b, monthKey))} — tap to mark ${
                            paid ? 'unpaid' : 'paid'
                          } for this month`}
                        >
                          {paid && <Check size={10} className="shrink-0" />}
                          <span className="truncate">{b.name}</span>
                        </button>
                      )
                    })}
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
