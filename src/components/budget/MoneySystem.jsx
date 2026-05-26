import { useState } from 'react'
import { ArrowRight, Loader2, Check } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { formatMoney } from '../../lib/finance'

const BUCKETS = [
  { key: 'tithes', label: 'Tithes', color: '#D4537E' },
  { key: 'invest', label: 'Invest', color: '#1D9E75' },
  { key: 'savings', label: 'Savings', color: '#3266ad' },
  { key: 'spend', label: 'Spend', color: '#E8A020' },
]

const DEFAULT_SYSTEM = { tithes: 10, invest: 20, savings: 20, spend: 50 }

export default function MoneySystem() {
  const { settings, updateSettings } = useData()

  const stored = settings?.money_system ?? DEFAULT_SYSTEM
  const [system, setSystem] = useState(stored)
  const [income, setIncome] = useState(settings?.income ?? 0)
  const [syncKey, setSyncKey] = useState(JSON.stringify(stored))
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  // Re-sync from store when it loads/changes (during render, per React docs).
  const storedKey = JSON.stringify(stored)
  if (storedKey !== syncKey) {
    setSyncKey(storedKey)
    setSystem(stored)
    setIncome(settings?.income ?? 0)
  }

  const total = BUCKETS.reduce((sum, b) => sum + (Number(system[b.key]) || 0), 0)
  const valid = total === 100

  async function save() {
    setBusy(true)
    setSaved(false)
    try {
      await updateSettings({ money_system: system, income: Number(income) || 0 })
      setSaved(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Monthly Income (₱)
          </span>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-slate-900">Allocation</h2>
          <span
            className={`text-sm font-semibold ${valid ? 'text-emerald-600' : 'text-red-600'}`}
          >
            Total: {total}%
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {BUCKETS.map((b) => {
            const pct = Number(system[b.key]) || 0
            const amount = ((Number(income) || 0) * pct) / 100
            return (
              <div key={b.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: b.color }}
                    />
                    {b.label}
                  </span>
                  <span className="text-slate-500">
                    {pct}% · {formatMoney(amount)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={pct}
                  onChange={(e) =>
                    setSystem((prev) => ({ ...prev, [b.key]: Number(e.target.value) }))
                  }
                  className="mt-1 w-full"
                  style={{ accentColor: b.color }}
                />
              </div>
            )
          })}
        </div>

        {!valid && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            Allocations must add up to exactly 100%.
          </p>
        )}

        <button
          onClick={save}
          disabled={!valid || busy}
          className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saved ? (
            <Check size={16} />
          ) : null}
          {saved ? 'Saved' : 'Save Allocation'}
        </button>
      </div>

      {/* BDO -> Maribank flow diagram */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-medium text-slate-900">Cash Flow</h2>
        <div className="mt-4 flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
          <FlowBox title="BDO" subtitle="Salary lands here" amount={formatMoney(income)} accent="#7F77DD" />
          <ArrowRight className="mx-auto rotate-90 text-slate-300 lg:rotate-0" size={22} />
          <div className="grid flex-1 grid-cols-2 gap-3">
            {BUCKETS.map((b) => {
              const amount = ((Number(income) || 0) * (Number(system[b.key]) || 0)) / 100
              const label = b.key === 'savings' ? 'Savings → Maribank' : b.label
              return (
                <FlowBox key={b.key} title={label} amount={formatMoney(amount)} accent={b.color} />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function FlowBox({ title, subtitle, amount, accent }) {
  return (
    <div
      className="rounded-lg border bg-slate-50 px-4 py-3"
      style={{ borderColor: accent }}
    >
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
      <div className="mt-1 text-sm font-medium" style={{ color: accent }}>
        {amount}
      </div>
    </div>
  )
}
