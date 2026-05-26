import { useMemo, useState } from 'react'
import { useData } from '../../context/DataContext'
import { formatMoney } from '../../lib/finance'
import { currentMonthKey, monthKeyOf } from '../../lib/dates'
import MonthSelector from './MonthSelector'

const PALETTE = ['#3266ad', '#1D9E75', '#E8A020', '#D4537E', '#7F77DD', '#BA7517', '#0F6E56', '#993C1D']

export default function MonthlySummary() {
  const { ledgerEntries, bankTransactions, holdings, digitalBanks, settings } = useData()
  const [month, setMonth] = useState(currentMonthKey())

  const { planVsActual, breakdown } = useMemo(() => {
    const income = Number(settings?.income) || 0
    const system = settings?.money_system ?? {
      tithes: 10,
      invest: 20,
      savings: 20,
      spend: 50,
    }
    const monthOut = ledgerEntries.filter(
      (e) => e.direction === 'out' && monthKeyOf(e.date) === month
    )
    const tithesActual = monthOut
      .filter((e) => e.category === 'Generosity')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0)
    const spendActual = monthOut
      .filter((e) => e.category !== 'Generosity')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0)

    const bankIn = bankTransactions
      .filter((t) => monthKeyOf(t.date) === month)
      .reduce((s, t) => s + (t.direction === 'in' ? Number(t.amount) || 0 : -(Number(t.amount) || 0)), 0)

    const investActual = holdings
      .filter((h) => monthKeyOf(h.date_added) === month)
      .reduce((s, h) => s + (Number(h.invested) || 0), 0)

    const rows = [
      { key: 'tithes', label: 'Generosity', plan: (income * system.tithes) / 100, actual: tithesActual },
      { key: 'invest', label: 'Invest', plan: (income * system.invest) / 100, actual: investActual },
      { key: 'savings', label: 'Savings', plan: (income * system.savings) / 100, actual: bankIn },
      { key: 'spend', label: 'Spend', plan: (income * system.spend) / 100, actual: spendActual },
    ]

    // Spending breakdown by category
    const byCat = {}
    for (const e of monthOut) {
      const c = e.category || 'Uncategorized'
      byCat[c] = (byCat[c] || 0) + (Number(e.amount) || 0)
    }
    const sortedBreakdown = Object.entries(byCat)
      .map(([label, value], i) => ({ label, value, color: PALETTE[i % PALETTE.length] }))
      .sort((a, b) => b.value - a.value)

    return { planVsActual: rows, breakdown: sortedBreakdown }
  }, [ledgerEntries, bankTransactions, holdings, month, settings])

  const breakdownTotal = breakdown.reduce((s, d) => s + d.value, 0)
  const banksTotal = digitalBanks.reduce((s, b) => s + (Number(b.balance) || 0), 0)

  return (
    <div className="space-y-5">
      <MonthSelector value={month} onChange={setMonth} />

      {/* Plan vs Actual */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="font-medium text-slate-900">Plan vs Actual</h2>
          <p className="text-xs text-slate-400">
            Plan = income × allocation. Actual: Tithes/Spend from ledger, Savings from net
            bank inflow, Invest from holdings added this month.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-2">Bucket</th>
              <th className="px-5 py-2">Plan</th>
              <th className="px-5 py-2">Actual</th>
              <th className="px-5 py-2">Difference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {planVsActual.map((r) => {
              const diff = r.actual - r.plan
              return (
                <tr key={r.key}>
                  <td className="px-5 py-2.5 font-medium text-slate-800">{r.label}</td>
                  <td className="px-5 py-2.5 text-slate-500">{formatMoney(r.plan)}</td>
                  <td className="px-5 py-2.5 text-slate-700">{formatMoney(r.actual)}</td>
                  <td
                    className={`px-5 py-2.5 font-medium ${
                      diff >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {diff >= 0 ? '+' : ''}
                    {formatMoney(diff)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Spending breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-medium text-slate-900">Spending Breakdown</h2>
          {breakdownTotal <= 0 ? (
            <p className="mt-4 text-sm text-slate-400">No spending this month.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {breakdown.map((d) => {
                const pct = (d.value / breakdownTotal) * 100
                return (
                  <div key={d.label}>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{d.label}</span>
                      <span className="text-slate-500">
                        {formatMoney(d.value)}{' '}
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

        {/* Digital banks snapshot */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-slate-900">Banks Snapshot</h2>
            <span className="text-sm font-semibold text-slate-900">
              {formatMoney(banksTotal)}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {digitalBanks.map((b) => (
              <div key={b.id} className="flex justify-between text-sm">
                <span className="text-slate-600">{b.bank_name}</span>
                <span className="text-slate-700">{formatMoney(b.balance)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
