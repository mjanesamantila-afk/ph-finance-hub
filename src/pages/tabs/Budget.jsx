import { useState } from 'react'
import MoneySystem from '../../components/budget/MoneySystem'
import Spending from '../../components/budget/Spending'
import DigitalBanks from '../../components/budget/DigitalBanks'
import Ledger from '../../components/budget/Ledger'
import MonthlySummary from '../../components/budget/MonthlySummary'

const SUBTABS = [
  { key: 'money', label: 'Money System', component: MoneySystem },
  { key: 'spending', label: 'Spending', component: Spending },
  { key: 'banks', label: 'Digital Banks', component: DigitalBanks },
  { key: 'ledger', label: 'Ledger', component: Ledger },
  { key: 'summary', label: 'Monthly Summary', component: MonthlySummary },
]

export default function Budget() {
  const [active, setActive] = useState('money')
  const Active = SUBTABS.find((t) => t.key === active)?.component ?? MoneySystem

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Budget</h1>

      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {SUBTABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
              active === t.key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <Active />
      </div>
    </div>
  )
}
