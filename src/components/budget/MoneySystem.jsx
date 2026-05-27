import { useMemo, useState } from 'react'
import { ArrowRight, Loader2, Check } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { formatMoney } from '../../lib/finance'
import { currentMonthKey, monthKeyOf, monthLabel } from '../../lib/dates'
import MonthSelector from './MonthSelector'

const BUCKETS = [
  { key: 'tithes', label: 'Generosity', color: '#D4537E' },
  { key: 'invest', label: 'Invest', color: '#1D9E75' },
  { key: 'savings', label: 'Savings', color: '#3266ad' },
  { key: 'spend', label: 'Spend', color: '#E8A020' },
]

const DEFAULT_SYSTEM = { tithes: 10, invest: 20, savings: 20, spend: 50 }

export default function MoneySystem() {
  const { settings, updateSettings, ledgerEntries } = useData()

  const stored = settings?.money_system ?? DEFAULT_SYSTEM
  const [system, setSystem] = useState(stored)
  const [income, setIncome] = useState(settings?.income ?? 0) // typical / expected
  const [syncKey, setSyncKey] = useState(JSON.stringify(stored))
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [month, setMonth] = useState(currentMonthKey())

  // Re-sync from store when it loads/changes (during render, per React docs).
  const storedKey = JSON.stringify(stored)
  if (storedKey !== syncKey) {
    setSyncKey(storedKey)
    setSystem(stored)
    setIncome(settings?.income ?? 0)
  }

  const total = BUCKETS.reduce((sum, b) => sum + (Number(system[b.key]) || 0), 0)
  const valid = total === 100

  // Actual income for the selected month = total "Money In" logged in the Ledger.
  const ledgerIncome = useMemo(
    () =>
      ledgerEntries
        .filter((e) => e.direction === 'in' && monthKeyOf(e.date) === month)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [ledgerEntries, month]
  )
  const typicalIncome = Number(income) || 0
  const usingFallback = ledgerIncome <= 0
  const effectiveIncome = usingFallback ? typicalIncome : ledgerIncome

  async function save() {
    setBusy(true)
    setSaved(false)
    try {
      await updateSettings({ money_system: system, income: typicalIncome })
      setSaved(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Income for the selected month (from the Ledger) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-medium text-slate-900">Income for {monthLabel(month)}</h2>
            <p className="text-sm text-slate-500">
              Pulled automatically from your Ledger “Money In” entries.
            </p>
          </div>
          <MonthSelector value={month} onChange={setMonth} />
        </div>
        <div className="mt-3 text-2xl font-semibold text-slate-900">
          {formatMoney(effectiveIncome)}
        </div>
        {usingFallback && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            No “Money In” logged for {monthLabel(month)} yet — showing your typical income
            below. Add income in the Ledger tab and this updates automatically.
          </p>
        )}
      </div>

      {/* Allocation */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-slate-900">Allocation</h2>
          <span
            className={`text-sm font-semibold ${valid ? 'text-emerald-600' : 'text-red-600'}`}
          >
            Total: {total}%
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Amounts below are {monthLabel(month)}’s income split by your percentages.
        </p>

        <div className="mt-4 space-y-4">
          {BUCKETS.map((b) => {
            const pct = Number(system[b.key]) || 0
            const amount = (effectiveIncome * pct) / 100
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

        <div className="mt-5 border-t border-slate-100 pt-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Typical / expected monthly income (₱)
            </span>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </label>
          <p className="mt-1 text-xs text-slate-400">
            Used only as a fallback for months with no income logged yet, and for the
            Freedom Plan projection.
          </p>
        </div>

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
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* BDO -> Maribank flow diagram */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-medium text-slate-900">Cash Flow — {monthLabel(month)}</h2>
        <div className="mt-4 flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
          <FlowBox
            title="BDO"
            subtitle="Income lands here"
            amount={formatMoney(effectiveIncome)}
            accent="#7F77DD"
          />
          <ArrowRight className="mx-auto rotate-90 text-slate-300 lg:rotate-0" size={22} />
          <div className="grid flex-1 grid-cols-2 gap-3">
            {BUCKETS.map((b) => {
              const amount = (effectiveIncome * (Number(system[b.key]) || 0)) / 100
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
