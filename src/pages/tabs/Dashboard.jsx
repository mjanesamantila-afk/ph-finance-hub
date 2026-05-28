import { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet2,
  PiggyBank,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Lightbulb,
} from 'lucide-react'
import { useData } from '../../context/DataContext'
import { deriveHolding, formatMoney } from '../../lib/finance'
import { COLORS, BROKER_COLORS } from '../../config/constants'
import { currentMonthKey, monthKeyOf, monthLabel } from '../../lib/dates'
import AllocationBars from '../../components/dashboard/AllocationBars'
import MonthSelector from '../../components/budget/MonthSelector'

const PALETTE = [
  '#3266ad', '#1D9E75', '#E8A020', '#D4537E', '#7F77DD', '#BA7517', '#0F6E56', '#993C1D',
]

const BUCKETS = [
  { key: 'tithes', label: 'Generosity', color: '#D4537E' },
  { key: 'invest', label: 'Invest', color: '#1D9E75' },
  { key: 'savings', label: 'Savings', color: '#3266ad' },
  { key: 'spend', label: 'Spend', color: '#E8A020' },
]
const DEFAULT_SYSTEM = { tithes: 10, invest: 20, savings: 20, spend: 50 }

export default function Dashboard() {
  const {
    holdings,
    ledgerEntries,
    spendBudgets,
    bankTransactions,
    digitalBanks,
    settings,
    loading,
    globalStopLoss,
    breachCount,
  } = useData()

  // Recent Activity: merge ledger entries + bank transactions, newest first.
  const recentActivity = useMemo(() => {
    const items = []
    for (const e of ledgerEntries) {
      items.push({
        id: 'L' + e.id,
        date: e.date,
        sort: e.created_at || e.date,
        direction: e.direction,
        amount: Number(e.amount) || 0,
        label: e.description || e.category || 'Ledger entry',
        meta: [e.category, e.method].filter(Boolean).join(' · '),
        kind: 'ledger',
      })
    }
    for (const t of bankTransactions) {
      items.push({
        id: 'B' + t.id,
        date: t.date,
        sort: t.created_at || t.date,
        direction: t.direction,
        amount: Number(t.amount) || 0,
        label: t.note || `${t.bank_name} ${t.direction === 'in' ? 'deposit' : 'withdrawal'}`,
        meta: t.bank_name,
        kind: 'bank',
      })
    }
    return items.sort((a, b) => (b.sort > a.sort ? 1 : -1)).slice(0, 10)
  }, [ledgerEntries, bankTransactions])

  const [month, setMonth] = useState(currentMonthKey())

  // ---- Budget (selected month) ----
  const budget = useMemo(() => {
    const ins = ledgerEntries.filter(
      (e) => e.direction === 'in' && monthKeyOf(e.date) === month
    )
    const outs = ledgerEntries.filter(
      (e) => e.direction === 'out' && monthKeyOf(e.date) === month
    )
    const income = ins.reduce((s, e) => s + (Number(e.amount) || 0), 0)
    const spent = outs.reduce((s, e) => s + (Number(e.amount) || 0), 0)
    const totalBudget = spendBudgets.reduce((s, b) => s + (Number(b.budget_amount) || 0), 0)

    const byCat = {}
    for (const e of outs) {
      const c = e.category || 'Uncategorized'
      byCat[c] = (byCat[c] || 0) + (Number(e.amount) || 0)
    }
    const breakdown = Object.entries(byCat)
      .map(([label, value], i) => ({ label, value, color: PALETTE[i % PALETTE.length] }))
      .sort((a, b) => b.value - a.value)

    // Allocation plan vs actual
    const system = settings?.money_system ?? DEFAULT_SYSTEM
    const planIncome = income > 0 ? income : Number(settings?.income) || 0
    const generosityActual = outs
      .filter((e) => e.category === 'Generosity')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0)
    const spendActual = outs
      .filter((e) => e.category !== 'Generosity')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0)
    const savingsActual = bankTransactions
      .filter((t) => monthKeyOf(t.date) === month)
      .reduce(
        (s, t) => s + (t.direction === 'in' ? Number(t.amount) || 0 : -(Number(t.amount) || 0)),
        0
      )
    const investActual = holdings
      .filter((h) => monthKeyOf(h.date_added) === month)
      .reduce((s, h) => s + (Number(h.invested) || 0), 0)
    const actualByKey = {
      tithes: generosityActual,
      spend: spendActual,
      savings: savingsActual,
      invest: investActual,
    }
    const allocation = BUCKETS.map((b) => ({
      ...b,
      plan: (planIncome * (Number(system[b.key]) || 0)) / 100,
      actual: actualByKey[b.key] || 0,
    }))

    return { income, spent, net: income - spent, totalBudget, breakdown, allocation }
  }, [ledgerEntries, spendBudgets, bankTransactions, holdings, settings, month])

  const banksTotal = digitalBanks.reduce((s, b) => s + (Number(b.balance) || 0), 0)
  // Top-level spending budget = your Money System "Spend" allocation
  // (income × spend%). Falls back to category budgets, then income.
  const spendBudget = budget.allocation.find((b) => b.key === 'spend')?.plan || 0
  const budgetBasis =
    spendBudget > 0 ? spendBudget : budget.totalBudget > 0 ? budget.totalBudget : budget.income
  const budgetBasisLabel =
    spendBudget > 0 ? 'of your Spend budget' : budget.totalBudget > 0 ? 'of category budgets' : 'of income'
  const remaining = budgetBasis - budget.spent
  const budgetPct = budgetBasis > 0 ? (budget.spent / budgetBasis) * 100 : 0
  const overBudget = budgetBasis > 0 && budget.spent > budgetBasis

  // ---- Investments ----
  const inv = useMemo(() => {
    let invested = 0
    let value = 0
    const typeMap = {}
    const brokerMap = {}
    for (const h of holdings) {
      const m = deriveHolding(h, globalStopLoss)
      invested += m.invested
      value += m.currentValue
      if (h.type) typeMap[h.type] = (typeMap[h.type] || 0) + m.currentValue
      if (h.broker) brokerMap[h.broker] = (brokerMap[h.broker] || 0) + m.currentValue
    }
    const gain = value - invested
    return {
      invested,
      value,
      gain,
      gainPct: invested ? (gain / invested) * 100 : 0,
      byType: Object.entries(typeMap).map(([label, val]) => ({
        label,
        value: val,
        color: COLORS[label] || '#64748b',
      })),
      byBroker: Object.entries(brokerMap).map(([label, val]) => ({
        label,
        value: val,
        color: BROKER_COLORS[label] || '#64748b',
      })),
    }
  }, [holdings, globalStopLoss])

  const gainPositive = inv.gain >= 0

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-10 text-center text-slate-400">Loading…</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <MonthSelector value={month} onChange={setMonth} />
      </div>

      {/* ===== Budget (highlight) ===== */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Budget · {monthLabel(month)}
        </h2>

        {/* Reordered: Income → Remaining → Spent → Savings */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={ArrowDownLeft} label="Income" value={formatMoney(budget.income)} tone="yellow" />
          <StatCard
            icon={Wallet2}
            label="Remaining to Spend"
            value={formatMoney(remaining)}
            sub={budgetBasisLabel}
            tone={remaining < 0 ? 'red' : 'slate'}
          />
          <StatCard icon={ArrowUpRight} label="Spent" value={formatMoney(budget.spent)} tone="red" />
          <StatCard icon={PiggyBank} label="Bank Savings" value={formatMoney(banksTotal)} />
        </div>

        {/* Budget usage */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-900">Budget Used</span>
            {budgetBasis > 0 ? (
              <span className={overBudget ? 'font-medium text-red-600' : 'text-slate-500'}>
                {formatMoney(budget.spent)} of {formatMoney(budgetBasis)}
              </span>
            ) : (
              <span className="text-slate-400">No budgets set</span>
            )}
          </div>
          {budgetBasis > 0 && (
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${overBudget ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(budgetPct, 100)}%` }}
              />
            </div>
          )}
          <div className="mt-2 text-xs text-slate-400">
            Net this month:{' '}
            <span className={budget.net >= 0 ? 'text-blue-600' : 'text-red-600'}>
              {budget.net >= 0 ? '+' : ''}
              {formatMoney(budget.net)}
            </span>
          </div>
        </div>

        {/* Allocation plan vs actual (mini) */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-medium text-slate-900">Allocation — Plan vs Actual</h3>
          <div className="mt-3 space-y-3">
            {budget.allocation.map((b) => {
              const pct = b.plan > 0 ? Math.min((b.actual / b.plan) * 100, 100) : 0
              return (
                <div key={b.key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: b.color }}
                      />
                      {b.label}
                    </span>
                    <span className="text-slate-500">
                      {formatMoney(b.actual)}{' '}
                      <span className="text-slate-400">of {formatMoney(b.plan)}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: b.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4">
          <AllocationBars title={`Spending Breakdown · ${monthLabel(month)}`} data={budget.breakdown} />
        </div>
      </section>

      {/* ===== Recent Activity ===== */}
      {recentActivity.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <Activity size={14} /> Recent Activity
          </h2>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    a.direction === 'in'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {a.direction === 'in' ? (
                    <ArrowDownLeft size={15} />
                  ) : (
                    <ArrowUpRight size={15} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">{a.label}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                    <span>{a.date}</span>
                    {a.meta && <span>· {a.meta}</span>}
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    a.direction === 'in' ? 'text-blue-600' : 'text-red-600'
                  }`}
                >
                  {a.direction === 'in' ? '+' : '−'}
                  {formatMoney(a.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== Investments (secondary) ===== */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Investments
        </h2>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Wallet} label="Total Invested" value={formatMoney(inv.invested)} />
          <StatCard icon={TrendingUp} label="Current Value" value={formatMoney(inv.value)} />
          <StatCard
            icon={gainPositive ? TrendingUp : TrendingDown}
            label="Gain / Loss"
            value={`${gainPositive ? '+' : ''}${formatMoney(inv.gain)}`}
            sub={`${gainPositive ? '+' : ''}${inv.gainPct.toFixed(2)}%`}
            tone={gainPositive ? 'emerald' : 'red'}
          />
          <StatCard
            icon={AlertTriangle}
            label="Stop Loss Alerts"
            value={breachCount}
            tone={breachCount > 0 ? 'red' : 'emerald'}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AllocationBars title="Allocation by Investment Type" data={inv.byType} />
          <AllocationBars title="Allocation by Broker" data={inv.byBroker} />
        </div>

        {holdings.length === 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
              <Lightbulb size={15} />
            </span>
            <div className="text-sm">
              <div className="font-semibold text-yellow-900">Pro tip</div>
              <p className="mt-0.5 text-yellow-800">
                Add your first holding in the <strong>Portfolio</strong> tab to start tracking
                gains, allocation, and stop-loss alerts.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

const TONES = {
  slate: 'text-slate-900',
  emerald: 'text-blue-600',
  red: 'text-red-600',
  yellow: 'text-yellow-600',
}

function StatCard({ icon: Icon, label, value, sub, tone = 'slate' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={16} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={`mt-2 text-xl font-semibold sm:text-2xl ${TONES[tone]}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  )
}
