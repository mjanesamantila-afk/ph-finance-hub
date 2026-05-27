import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { SPENDING_CATS } from '../../config/constants'
import { spendingCategoryGroups } from '../../lib/categories'
import { formatMoney } from '../../lib/finance'
import { currentMonthKey, monthKeyOf } from '../../lib/dates'
import { upsertBudget } from '../../lib/budget'
import MonthSelector from './MonthSelector'

export default function Spending() {
  const { user } = useAuth()
  const { ledgerEntries, spendBudgets, settings, updateSettings, refetch } = useData()

  const [month, setMonth] = useState(currentMonthKey())
  const [tab, setTab] = useState('manual') // 'manual' | 'digital'
  const [newCat, setNewCat] = useState('')

  const custom = settings?.custom_categories ?? { manual: [], digital: [] }
  const hidden = custom.hidden ?? { manual: [], digital: [] }
  const hiddenForTab = hidden[tab] ?? []
  const baseCats = (SPENDING_CATS[tab] ?? []).filter((c) => !hiddenForTab.includes(c))
  const customCats = custom[tab] ?? []
  const categories = [...baseCats, ...customCats]

  const budgetMap = useMemo(() => {
    const map = {}
    for (const b of spendBudgets) map[b.category] = Number(b.budget_amount) || 0
    return map
  }, [spendBudgets])

  // Spending per category for the selected month (ledger 'out' entries).
  const monthOut = useMemo(
    () =>
      ledgerEntries.filter(
        (e) => e.direction === 'out' && monthKeyOf(e.date) === month
      ),
    [ledgerEntries, month]
  )

  // Totals across BOTH cash (manual) and digital, independent of the toggle.
  const groups = spendingCategoryGroups(settings)
  const manualSet = new Set(groups.manual)
  const cashAllocated = groups.manual.reduce((s, c) => s + (budgetMap[c] || 0), 0)
  const digitalAllocated = groups.digital
    .filter((c) => !manualSet.has(c))
    .reduce((s, c) => s + (budgetMap[c] || 0), 0)
  const totalAllocated = cashAllocated + digitalAllocated
  const totalSpent = monthOut.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const overAllocated = totalAllocated > 0 && totalSpent > totalAllocated

  function spentFor(category) {
    return monthOut
      .filter((e) => e.category === category)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  }
  function recentFor(category) {
    return monthOut.filter((e) => e.category === category).slice(0, 3)
  }

  async function saveBudget(category, amount) {
    await upsertBudget(user.id, category, amount)
    await refetch()
  }

  async function addCustomCategory() {
    const name = newCat.trim()
    if (!name) return
    // Re-adding a previously removed built-in just un-hides it.
    if (hiddenForTab.includes(name)) {
      const nextHidden = { ...hidden, [tab]: hiddenForTab.filter((c) => c !== name) }
      await updateSettings({ custom_categories: { ...custom, hidden: nextHidden } })
      setNewCat('')
      return
    }
    if (categories.includes(name)) return
    const next = { ...custom, [tab]: [...customCats, name] }
    await updateSettings({ custom_categories: next })
    setNewCat('')
  }

  // Delete any category: custom ones are removed; built-in ones are hidden
  // (so they can be restored later by re-adding the same name).
  async function removeCategory(name) {
    if (customCats.includes(name)) {
      const next = { ...custom, [tab]: customCats.filter((c) => c !== name) }
      await updateSettings({ custom_categories: next })
    } else {
      const nextHidden = { ...hidden, [tab]: [...hiddenForTab, name] }
      await updateSettings({ custom_categories: { ...custom, hidden: nextHidden } })
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthSelector value={month} onChange={setMonth} />
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
          <ToggleBtn active={tab === 'manual'} onClick={() => setTab('manual')}>
            Cash / Manual
          </ToggleBtn>
          <ToggleBtn active={tab === 'digital'} onClick={() => setTab('digital')}>
            Digital / Bills
          </ToggleBtn>
        </div>
      </div>

      {/* Total allocated across both cash and digital */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-900">Total Allocated (Cash + Digital)</span>
          <span className="text-lg font-semibold text-slate-900">
            {formatMoney(totalAllocated)}
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-400">
          Cash {formatMoney(cashAllocated)} · Digital {formatMoney(digitalAllocated)}
        </div>
        <div className="mt-3 flex justify-between text-sm">
          <span className={overAllocated ? 'font-medium text-red-600' : 'text-slate-500'}>
            {formatMoney(totalSpent)} spent this month
          </span>
          <span className="text-slate-400">of {formatMoney(totalAllocated)}</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${overAllocated ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{
              width: `${totalAllocated > 0 ? Math.min((totalSpent / totalAllocated) * 100, 100) : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const budget = budgetMap[cat] || 0
          const spent = spentFor(cat)
          const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
          const over = budget > 0 && spent > budget
          return (
            <div key={cat} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-900">{cat}</h3>
                <button
                  onClick={() => removeCategory(cat)}
                  className="text-slate-300 hover:text-red-500"
                  title="Remove category"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <label className="mt-2 block">
                <span className="text-xs text-slate-400">Monthly budget (₱)</span>
                <input
                  type="number"
                  defaultValue={budget || ''}
                  onBlur={(e) => saveBudget(cat, e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </label>

              <div className="mt-3 flex justify-between text-xs">
                <span className={over ? 'font-medium text-red-600' : 'text-slate-500'}>
                  {formatMoney(spent)} spent
                </span>
                <span className="text-slate-400">of {formatMoney(budget)}</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-3 space-y-1">
                {recentFor(cat).length === 0 ? (
                  <p className="text-xs text-slate-300">No expenses this month</p>
                ) : (
                  recentFor(cat).map((e) => (
                    <div key={e.id} className="flex justify-between text-xs text-slate-500">
                      <span className="truncate">{e.description || e.date}</span>
                      <span>{formatMoney(e.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustomCategory()}
          placeholder={`Add custom ${tab} category`}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
        />
        <button
          onClick={addCustomCategory}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          <Plus size={15} />
          Add
        </button>
      </div>
    </div>
  )
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 font-medium transition ${
        active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  )
}
