import { useMemo } from 'react'
import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { deriveHolding, formatMoney } from '../../lib/finance'
import { COLORS, BROKER_COLORS } from '../../config/constants'
import AllocationBars from '../../components/dashboard/AllocationBars'

export default function Dashboard() {
  const { holdings, loading, globalStopLoss, breachCount } = useData()

  const { totalInvested, totalValue, gain, gainPct, byType, byBroker } = useMemo(() => {
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

    const g = value - invested
    return {
      totalInvested: invested,
      totalValue: value,
      gain: g,
      gainPct: invested ? (g / invested) * 100 : 0,
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

  const gainPositive = gain >= 0

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>

      {loading ? (
        <p className="mt-10 text-center text-slate-400">Loading…</p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Wallet}
              label="Total Invested"
              value={formatMoney(totalInvested)}
            />
            <StatCard
              icon={TrendingUp}
              label="Current Value"
              value={formatMoney(totalValue)}
            />
            <StatCard
              icon={gainPositive ? TrendingUp : TrendingDown}
              label="Total Gain / Loss"
              value={`${gainPositive ? '+' : ''}${formatMoney(gain)}`}
              sub={`${gainPositive ? '+' : ''}${gainPct.toFixed(2)}%`}
              tone={gainPositive ? 'emerald' : 'red'}
            />
            <StatCard
              icon={AlertTriangle}
              label="Stop Loss Alerts"
              value={breachCount}
              tone={breachCount > 0 ? 'red' : 'emerald'}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AllocationBars title="Allocation by Investment Type" data={byType} />
            <AllocationBars title="Allocation by Broker" data={byBroker} />
          </div>

          {holdings.length === 0 && (
            <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-400">
              Add investments in the Portfolio tab to populate your dashboard.
            </p>
          )}
        </>
      )}
    </div>
  )
}

const TONES = {
  slate: 'text-slate-900',
  emerald: 'text-emerald-600',
  red: 'text-red-600',
}

function StatCard({ icon: Icon, label, value, sub, tone = 'slate' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={16} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={`mt-2 text-2xl font-semibold ${TONES[tone]}`}>{value}</div>
      {sub && <div className={`text-sm font-medium ${TONES[tone]}`}>{sub}</div>}
    </div>
  )
}
