import { useMemo, useState } from 'react'
import { Plus, RefreshCw, Loader2, Briefcase } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { deleteHolding, refreshHoldingPrice } from '../../lib/holdings'
import HoldingForm from '../../components/portfolio/HoldingForm'
import HoldingCard from '../../components/portfolio/HoldingCard'
import BuyMoreForm from '../../components/portfolio/BuyMoreForm'

export default function Portfolio() {
  const { holdings, loading, globalStopLoss, refetch } = useData()

  const [brokerFilter, setBrokerFilter] = useState('All')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [buyingHolding, setBuyingHolding] = useState(null)
  const [refreshingId, setRefreshingId] = useState(null)
  const [refreshingAll, setRefreshingAll] = useState(false)
  const [notice, setNotice] = useState('')

  const brokers = useMemo(() => {
    const set = new Set(holdings.map((h) => h.broker).filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [holdings])

  const visible = useMemo(
    () =>
      brokerFilter === 'All'
        ? holdings
        : holdings.filter((h) => h.broker === brokerFilter),
    [holdings, brokerFilter]
  )

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(holding) {
    setEditing(holding)
    setFormOpen(true)
  }

  async function handleDelete(holding) {
    if (!window.confirm(`Delete "${holding.name}"? This can't be undone.`)) return
    await deleteHolding(holding.id)
    await refetch()
  }

  async function handleRefreshOne(holding) {
    setRefreshingId(holding.id)
    setNotice('')
    try {
      const { ok } = await refreshHoldingPrice(holding)
      if (!ok) setNotice(`Couldn't fetch a price for ${holding.ticker}.`)
      await refetch()
    } finally {
      setRefreshingId(null)
    }
  }

  async function handleRefreshAll() {
    const withTickers = holdings.filter(
      (h) => h.type === 'Stocks (PSE)' && h.ticker
    )
    if (!withTickers.length) {
      setNotice('No PSE holdings with a ticker to refresh.')
      return
    }
    setRefreshingAll(true)
    setNotice('')
    let failed = 0
    for (const h of withTickers) {
      try {
        const { ok } = await refreshHoldingPrice(h)
        if (!ok) failed += 1
      } catch {
        failed += 1
      }
    }
    await refetch()
    setRefreshingAll(false)
    setNotice(
      failed
        ? `Refreshed prices. ${failed} ticker(s) couldn't be fetched.`
        : 'All PSE prices refreshed.'
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Portfolio</h1>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshAll}
            disabled={refreshingAll}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            {refreshingAll ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            Refresh PSE Prices
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={15} />
            Add Investment
          </button>
        </div>
      </div>

      {brokers.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {brokers.map((b) => (
            <button
              key={b}
              onClick={() => setBrokerFilter(b)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                brokerFilter === b
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      )}

      {notice && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {notice}
        </p>
      )}

      {loading ? (
        <p className="mt-10 text-center text-slate-400">Loading holdings…</p>
      ) : visible.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Briefcase className="mb-3 text-slate-300" size={32} />
          <p className="text-slate-500">
            {holdings.length === 0
              ? 'No investments yet. Add your first holding to get started.'
              : 'No holdings for this broker.'}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((h) => (
            <HoldingCard
              key={h.id}
              holding={h}
              globalStopLoss={globalStopLoss}
              refreshing={refreshingId === h.id}
              onRefresh={handleRefreshOne}
              onEdit={openEdit}
              onDelete={handleDelete}
              onBuyMore={setBuyingHolding}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <HoldingForm
          holding={editing}
          defaultStopLoss={globalStopLoss}
          onClose={() => setFormOpen(false)}
          onSaved={refetch}
        />
      )}

      {buyingHolding && (
        <BuyMoreForm
          holding={buyingHolding}
          onClose={() => setBuyingHolding(null)}
          onSaved={refetch}
        />
      )}
    </div>
  )
}
