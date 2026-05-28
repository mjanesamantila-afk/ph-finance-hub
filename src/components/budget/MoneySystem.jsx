import { useMemo, useState } from 'react'
import { ArrowRight, Loader2, Check, Plus, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { formatMoney } from '../../lib/finance'
import { currentMonthKey, monthKeyOf, monthLabel } from '../../lib/dates'
import {
  readBuckets,
  toMoneySystemPayload,
  pickColor,
  newBucketKey,
} from '../../lib/money'
import MonthSelector from './MonthSelector'

export default function MoneySystem() {
  const { settings, updateSettings, ledgerEntries } = useData()

  const stored = settings?.money_system
  const [buckets, setBuckets] = useState(() => readBuckets(settings))
  const [income, setIncome] = useState(settings?.income ?? 0)
  const [syncKey, setSyncKey] = useState(JSON.stringify(stored ?? null))
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [month, setMonth] = useState(currentMonthKey())
  const [newLabel, setNewLabel] = useState('')
  const [newPct, setNewPct] = useState('')

  // Re-sync from store when it loads/changes (render-time pattern).
  const storedKey = JSON.stringify(stored ?? null)
  if (storedKey !== syncKey) {
    setSyncKey(storedKey)
    setBuckets(readBuckets(settings))
    setIncome(settings?.income ?? 0)
  }

  const total = buckets.reduce((sum, b) => sum + (Number(b.pct) || 0), 0)
  const valid = total === 100

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

  function updateBucket(key, patch) {
    setBuckets((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b)))
  }
  function removeBucket(key) {
    setBuckets((prev) => prev.filter((b) => b.key !== key))
  }
  function addBucket(e) {
    e.preventDefault()
    const label = newLabel.trim()
    if (!label) return
    const pct = Number(newPct) || 0
    setBuckets((prev) => [
      ...prev,
      { key: newBucketKey(label), label, pct, color: pickColor(prev) },
    ])
    setNewLabel('')
    setNewPct('')
  }

  async function save() {
    setBusy(true)
    setSaved(false)
    try {
      await updateSettings({
        money_system: toMoneySystemPayload(buckets),
        income: typicalIncome,
      })
      setSaved(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Income for the selected month */}
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
            No “Money In” logged for {monthLabel(month)} yet — showing your typical income.
          </p>
        )}
      </div>

      {/* Allocation — flexible buckets */}
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
          Add, edit, or remove buckets. Amounts shown are {monthLabel(month)}’s income split
          by your percentages.
        </p>

        <div className="mt-4 space-y-2">
          {buckets.map((b) => {
            const amount = (effectiveIncome * (Number(b.pct) || 0)) / 100
            return (
              <div
                key={b.key}
                className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2"
              >
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: b.color }}
                />
                <input
                  type="text"
                  value={b.label}
                  onChange={(e) => updateBucket(b.key, { label: e.target.value })}
                  className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-1 text-sm text-slate-800 hover:border-slate-200 focus:border-emerald-500 focus:outline-none"
                  placeholder="Bucket name"
                />
                <input
                  type="number"
                  step="any"
                  value={b.pct}
                  onChange={(e) => updateBucket(b.key, { pct: e.target.value })}
                  className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
                />
                <span className="w-8 text-xs text-slate-400">%</span>
                <span className="hidden w-28 text-right text-sm text-slate-500 sm:inline-block">
                  {formatMoney(amount)}
                </span>
                <button
                  onClick={() => removeBucket(b.key)}
                  className="text-slate-300 hover:text-red-500"
                  title="Remove bucket"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>

        {/* Add bucket */}
        <form onSubmit={addBucket} className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="New bucket (e.g. Travel, Emergency)"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            step="any"
            value={newPct}
            onChange={(e) => setNewPct(e.target.value)}
            placeholder="%"
            className="w-20 rounded-lg border border-slate-300 px-2 py-2 text-sm"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <Plus size={15} />
            Add
          </button>
        </form>

        {!valid && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            Allocations must add up to exactly 100% (currently {total}%).
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

      {/* BDO -> bucket flow diagram (flexible to all buckets) */}
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
            {buckets.map((b) => {
              const amount = (effectiveIncome * (Number(b.pct) || 0)) / 100
              const label = b.key === 'savings' ? 'Savings → Maribank' : b.label
              return (
                <FlowBox
                  key={b.key}
                  title={label}
                  amount={formatMoney(amount)}
                  accent={b.color}
                />
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
