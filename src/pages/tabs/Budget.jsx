import { useState } from 'react'
import { useData } from '../../context/DataContext'
import MoneySystem from '../../components/budget/MoneySystem'
import Spending from '../../components/budget/Spending'
import DigitalBanks from '../../components/budget/DigitalBanks'
import Ledger from '../../components/budget/Ledger'
import MonthlySummary from '../../components/budget/MonthlySummary'
import Bills from './Bills'
import Subscriptions from './Subscriptions'

const SUBTABS = [
  { key: 'money', label: 'Money System', component: MoneySystem },
  { key: 'expenses', label: 'Expenses', component: Spending },
  { key: 'banks', label: 'Banks', component: DigitalBanks },
  { key: 'ledger', label: 'Ledger', component: Ledger },
  { key: 'summary', label: 'Monthly Summary', component: MonthlySummary },
  { key: 'bills', label: 'Bills Payment', component: Bills, badge: 'bills' },
  { key: 'subs', label: 'Subscriptions', component: Subscriptions, badge: 'subs' },
]

export default function Budget() {
  const { billsDueSoon, subscriptionsDueSoon } = useData()
  const [active, setActive] = useState('money')
  const Active = SUBTABS.find((t) => t.key === active)?.component ?? MoneySystem

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Spending</h1>

      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {SUBTABS.map((t) => {
          const count =
            t.badge === 'bills'
              ? billsDueSoon
              : t.badge === 'subs'
                ? subscriptionsDueSoon
                : 0
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`relative flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
                active === t.key
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-5">
        <Active />
      </div>
    </div>
  )
}
