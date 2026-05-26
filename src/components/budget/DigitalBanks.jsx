import { useData } from '../../context/DataContext'
import { formatMoney } from '../../lib/finance'
import DigitalBankCard from './DigitalBankCard'

export default function DigitalBanks() {
  const { digitalBanks, bankTransactions, interestHistory, refetch } = useData()

  const totalBalance = digitalBanks.reduce((sum, b) => sum + (Number(b.balance) || 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
        <span className="text-sm text-slate-500">Total across banks</span>
        <span className="text-xl font-semibold text-slate-900">
          {formatMoney(totalBalance)}
        </span>
      </div>

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
    </div>
  )
}
