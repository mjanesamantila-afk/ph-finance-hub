import { RefreshCw, Pencil, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { COLORS, BROKER_COLORS } from '../../config/constants'
import { deriveHolding, formatMoney } from '../../lib/finance'

export default function HoldingCard({
  holding,
  globalStopLoss,
  refreshing,
  onRefresh,
  onEdit,
  onDelete,
}) {
  const m = deriveHolding(holding, globalStopLoss)
  const cur = holding.currency || 'PHP'
  const typeColor = COLORS[holding.type] || '#64748b'
  const brokerColor = BROKER_COLORS[holding.broker] || '#64748b'
  const gainPositive = m.gain >= 0

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        m.breached ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-slate-900">{holding.name}</h3>
            {holding.ticker && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
                {holding.ticker}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: typeColor }}
            >
              {holding.type}
            </span>
            {holding.broker && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: brokerColor }}
              >
                {holding.broker}
              </span>
            )}
          </div>
        </div>

        {m.breached && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-600 px-2 py-1 text-xs font-semibold text-white">
            <AlertTriangle size={12} />
            Stop loss triggered
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
        <Metric label="Invested" value={formatMoney(m.invested, cur)} />
        <Metric label="Current Value" value={formatMoney(m.currentValue, cur)} />
        <Metric
          label="Gain / Loss"
          value={`${gainPositive ? '+' : ''}${formatMoney(m.gain, cur)} (${
            gainPositive ? '+' : ''
          }${m.gainPct.toFixed(2)}%)`}
          valueClass={gainPositive ? 'text-emerald-600' : 'text-red-600'}
        />
        <Metric label="Shares / Units" value={m.shares ? m.shares.toLocaleString() : '—'} />
      </div>

      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Stop loss {m.stopLossPct}% · SL price {formatMoney(m.stopPrice, cur)} · current{' '}
        {formatMoney(m.currentPrice, cur)}
      </div>

      <div className="mt-3 flex gap-2">
        {holding.ticker && (
          <button
            onClick={() => onRefresh(holding)}
            disabled={refreshing}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RefreshCw size={13} />
            )}
            Refresh
          </button>
        )}
        <button
          onClick={() => onEdit(holding)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
        >
          <Pencil size={13} />
          Edit
        </button>
        <button
          onClick={() => onDelete(holding)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
        >
          <Trash2 size={13} />
          Delete
        </button>
      </div>
    </div>
  )
}

function Metric({ label, value, valueClass = 'text-slate-900' }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`font-medium ${valueClass}`}>{value}</div>
    </div>
  )
}
