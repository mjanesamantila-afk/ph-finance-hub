import { useMemo, useState } from 'react'
import { ShieldAlert, AlertTriangle, Activity, TrendingDown } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { deriveHolding, formatMoney } from '../../lib/finance'

export default function RiskManagement() {
  const { holdings, loading, globalStopLoss, updateSettings } = useData()

  // Local slider value for live preview; persisted on release. Re-sync (during
  // render, per React docs) when the stored value loads/changes.
  const [slPct, setSlPct] = useState(globalStopLoss)
  const [syncedFrom, setSyncedFrom] = useState(globalStopLoss)
  if (globalStopLoss !== syncedFrom) {
    setSyncedFrom(globalStopLoss)
    setSlPct(globalStopLoss)
  }

  const rows = useMemo(
    () =>
      holdings.map((h) => {
        const m = deriveHolding(h, slPct)
        // Max loss if the stop is hit: the slice of invested capital at risk.
        const maxLoss = m.invested * (m.stopLossPct / 100)
        const distancePct =
          m.currentPrice > 0 ? ((m.currentPrice - m.stopPrice) / m.currentPrice) * 100 : null
        return { holding: h, m, maxLoss, distancePct }
      }),
    [holdings, slPct]
  )

  const alertCount = rows.filter((r) => r.m.breached).length
  // Aggregate max loss (numeric sum; USD/GoTrade positions counted at face value).
  const totalMaxLoss = rows.reduce((sum, r) => sum + r.maxLoss, 0)

  function commit() {
    if (slPct !== globalStopLoss) updateSettings({ global_stop_loss: slPct })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Risk Management</h1>

      {/* Global stop loss slider */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium text-slate-900">Global Stop Loss</h2>
            <p className="text-sm text-slate-500">
              Applied to holdings without their own stop-loss override.
            </p>
          </div>
          <span className="text-2xl font-semibold text-emerald-600">{slPct}%</span>
        </div>
        <input
          type="range"
          min={1}
          max={30}
          step={1}
          value={slPct}
          onChange={(e) => setSlPct(Number(e.target.value))}
          onMouseUp={commit}
          onTouchEnd={commit}
          onKeyUp={commit}
          className="mt-4 w-full accent-emerald-600"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>1%</span>
          <span>30%</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={Activity}
          label="Total Positions"
          value={holdings.length}
          tone="slate"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Stop Loss Alerts"
          value={alertCount}
          tone={alertCount > 0 ? 'red' : 'emerald'}
        />
        <SummaryCard
          icon={TrendingDown}
          label="Max Portfolio Loss"
          value={formatMoney(totalMaxLoss)}
          tone="slate"
        />
      </div>

      {/* Alert banner */}
      {alertCount > 0 && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle size={18} />
          {alertCount} position{alertCount > 1 ? 's have' : ' has'} breached the stop loss.
        </div>
      )}

      {/* Per-position monitor */}
      {loading ? (
        <p className="mt-10 text-center text-slate-400">Loading positions…</p>
      ) : rows.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <ShieldAlert className="mb-3 text-slate-300" size={32} />
          <p className="text-slate-500">No positions to monitor yet.</p>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">SL Price</th>
                  <th className="px-4 py-3">Current</th>
                  <th className="px-4 py-3">Max Loss</th>
                  <th className="px-4 py-3">Distance to SL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(({ holding, m, maxLoss, distancePct }) => {
                  const cur = holding.currency || 'PHP'
                  return (
                    <tr key={holding.id} className={m.breached ? 'bg-red-50/60' : ''}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{holding.name}</div>
                        <div className="text-xs text-slate-400">
                          {holding.ticker || holding.type} · SL {m.stopLossPct}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatMoney(m.stopPrice, cur)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatMoney(m.currentPrice, cur)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatMoney(maxLoss, cur)}</td>
                      <td className="px-4 py-3">
                        <DistanceBadge distancePct={distancePct} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function DistanceBadge({ distancePct }) {
  if (distancePct === null) return <span className="text-slate-400">—</span>
  const breached = distancePct <= 0
  const close = distancePct > 0 && distancePct < 5
  const cls = breached
    ? 'bg-red-100 text-red-700'
    : close
      ? 'bg-amber-100 text-amber-700'
      : 'bg-emerald-100 text-emerald-700'
  const label = breached ? 'Breached' : `${distancePct.toFixed(1)}% away`
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
  )
}

const TONES = {
  slate: 'text-slate-900',
  red: 'text-red-600',
  emerald: 'text-emerald-600',
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={16} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={`mt-2 text-2xl font-semibold ${TONES[tone]}`}>{value}</div>
    </div>
  )
}
