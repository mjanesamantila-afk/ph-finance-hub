import { formatMoney } from '../../lib/finance'

// data: [{ label, value, color }] — renders horizontal allocation bars.
export default function AllocationBars({ title, data, currency = 'PHP' }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const sorted = [...data].sort((a, b) => b.value - a.value)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-medium text-slate-900">{title}</h2>
      {total <= 0 ? (
        <p className="mt-4 text-sm text-slate-400">No data yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {sorted.map((d) => {
            const pct = total > 0 ? (d.value / total) * 100 : 0
            return (
              <div key={d.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    {d.label}
                  </span>
                  <span className="text-slate-500">
                    {formatMoney(d.value, currency)}{' '}
                    <span className="text-slate-400">({pct.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: d.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
