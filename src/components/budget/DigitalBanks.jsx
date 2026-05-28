import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { formatMoney } from '../../lib/finance'
import DigitalBankCard from './DigitalBankCard'
import AddBankForm from './AddBankForm'

export default function DigitalBanks() {
  const { digitalBanks, bankTransactions, interestHistory, refetch } = useData()
  const [addOpen, setAddOpen] = useState(false)

  const totalBalance = digitalBanks.reduce((sum, b) => sum + (Number(b.balance) || 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div>
          <div className="text-sm text-slate-500">Total across banks</div>
          <div className="text-xl font-semibold text-slate-900">{formatMoney(totalBalance)}</div>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={15} />
          Add Bank
        </button>
      </div>

      {digitalBanks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
          No banks yet. Add one to start tracking.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {digitalBanks.map((bank) => (
            <DigitalBankCard
              key={bank.id}
              bank={bank}
              transactions={bankTransactions.filter((t) => t.bank_name === bank.bank_name)}
              interestRows={interestHistory
                .filter((r) => r.bank_name === bank.bank_name)
                .sort((a, b) => b.month.localeCompare(a.month))}
              onChanged={refetch}
            />
          ))}
        </div>
      )}

      {addOpen && (
        <AddBankForm onClose={() => setAddOpen(false)} onSaved={refetch} />
      )}
    </div>
  )
}
