import { useState } from 'react'
import { useData } from '../../context/DataContext'
import InvestmentPlan from '../../components/investment/InvestmentPlan'
import Portfolio from './Portfolio'
import RiskManagement from './RiskManagement'
import FreedomPlan from './FreedomPlan'

const SUBTABS = [
  { key: 'plan', label: 'Investment Plan', component: InvestmentPlan },
  { key: 'portfolio', label: 'Portfolio', component: Portfolio },
  { key: 'risk', label: 'Risk Management', component: RiskManagement, badge: 'breach' },
  { key: 'freedom', label: 'Freedom Plan', component: FreedomPlan },
]

export default function Investment() {
  const { breachCount } = useData()
  const [active, setActive] = useState('plan')
  const Active = SUBTABS.find((t) => t.key === active)?.component ?? InvestmentPlan

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Investment</h1>

      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {SUBTABS.map((t) => {
          const count = t.badge === 'breach' ? breachCount : 0
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
