import { useMemo, useState } from 'react'
import { Target, TrendingUp, Loader2, Check } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { deriveHolding, formatMoney } from '../../lib/finance'

const DEFAULT_PLAN = {
  currentAge: '',
  retireAge: '',
  monthlyGoal: '',
  expectedReturn: 8,
  monthlyContribution: '',
  inflation: 4,
}

// FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r   (annual compounding)
function projectedBalance(years, pv, pmtAnnual, r) {
  if (years <= 0) return pv
  if (r === 0) return pv + pmtAnnual * years
  const g = Math.pow(1 + r, years)
  return pv * g + pmtAnnual * ((g - 1) / r)
}

export default function FreedomPlan() {
  const { settings, holdings, updateSettings } = useData()

  const stored = settings?.freedom_plan ?? DEFAULT_PLAN
  const [plan, setPlan] = useState(stored)
  const [syncKey, setSyncKey] = useState(JSON.stringify(stored))
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const storedKey = JSON.stringify(stored)
  if (storedKey !== syncKey) {
    setSyncKey(storedKey)
    setPlan(stored)
  }

  // PV = current portfolio value; PMT = planned annual investment from Money System.
  const pv = useMemo(
    () =>
      holdings.reduce(
        (sum, h) => sum + deriveHolding(h, settings?.global_stop_loss ?? 10).currentValue,
        0
      ),
    [holdings, settings]
  )
  const monthlyInvest = useMemo(() => {
    const income = Number(settings?.income) || 0
    const investPct = Number(settings?.money_system?.invest) || 0
    return (income * investPct) / 100
  }, [settings])

  const r = (Number(plan.expectedReturn) || 0) / 100
  const currentAge = Number(plan.currentAge) || 0
  const retireAge = Number(plan.retireAge) || 0
  const monthlyGoal = Number(plan.monthlyGoal) || 0
  const years = retireAge - currentAge
  // Use the contribution the user typed; if blank, fall back to the Money
  // System Invest amount.
  const hasManualContribution =
    plan.monthlyContribution !== '' && plan.monthlyContribution != null
  const monthlyContribution = hasManualContribution
    ? Number(plan.monthlyContribution) || 0
    : monthlyInvest
  const pmtAnnual = monthlyContribution * 12

  // Inflation-adjusted corpus: your monthly goal in *today's* pesos becomes a
  // larger number by retirement, so the corpus you need is larger too.
  const inflation = (Number(plan.inflation) || 0) / 100
  const futureMonthlyGoal =
    years > 0 ? monthlyGoal * Math.pow(1 + inflation, years) : monthlyGoal
  const neededCorpus = (futureMonthlyGoal * 12) / 0.04
  const projected = years > 0 ? projectedBalance(years, pv, pmtAnnual, r) : pv
  const progressPct = neededCorpus > 0 ? (projected / neededCorpus) * 100 : 0
  const onTrack = neededCorpus > 0 && projected >= neededCorpus
  const shortfall = Math.max(neededCorpus - projected, 0)

  // For each milestone, find the first age its target is reached.
  const milestones = useMemo(() => {
    return [25, 50, 75, 100].map((pct) => {
      const target = (neededCorpus * pct) / 100
      let reachedAge = null
      if (target > 0) {
        for (let y = 0; y <= 80; y++) {
          if (projectedBalance(y, pv, pmtAnnual, r) >= target) {
            reachedAge = currentAge > 0 ? currentAge + y : y
            break
          }
        }
      }
      return { pct, target, reachedAge }
    })
  }, [neededCorpus, pv, pmtAnnual, r, currentAge])

  async function save() {
    setBusy(true)
    setSaved(false)
    try {
      await updateSettings({ freedom_plan: plan })
      setSaved(true)
    } finally {
      setBusy(false)
    }
  }

  function field(key, value) {
    setPlan((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-slate-900">Freedom Plan</h1>

      {/* Inputs */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Input label="Current Age" value={plan.currentAge} onChange={(v) => field('currentAge', v)} />
          <Input label="Retire Age" value={plan.retireAge} onChange={(v) => field('retireAge', v)} />
          <Input
            label="Monthly Passive Income Goal (₱)"
            value={plan.monthlyGoal}
            onChange={(v) => field('monthlyGoal', v)}
          />
          <Input
            label="Expected Return (% p.a.)"
            value={plan.expectedReturn}
            onChange={(v) => field('expectedReturn', v)}
          />
          <Input
            label="Monthly Contribution (₱)"
            value={plan.monthlyContribution}
            onChange={(v) => field('monthlyContribution', v)}
            placeholder={`auto: ${Math.round(monthlyInvest)}`}
          />
          <Input
            label="Inflation (% p.a.)"
            value={plan.inflation}
            onChange={(v) => field('inflation', v)}
          />
        </div>
        <button
          onClick={save}
          disabled={busy}
          className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
          {saved ? 'Saved' : 'Save Plan'}
        </button>
        <p className="mt-3 text-xs text-slate-400">
          Projection starts from your current portfolio value ({formatMoney(pv)}) and adds{' '}
          {formatMoney(monthlyContribution)}/mo
          {hasManualContribution ? '' : ' (from your Money System Invest %)'}. Leave Monthly
          Contribution blank to use your Money System amount.
        </p>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ResultCard
          icon={Target}
          label="Corpus Needed (4% rule)"
          value={formatMoney(neededCorpus)}
          sub={
            monthlyGoal > 0
              ? years > 0 && inflation > 0
                ? `for ${formatMoney(monthlyGoal)}/mo today (${formatMoney(futureMonthlyGoal)}/mo in ${years}y after ${plan.inflation}% inflation)`
                : `for ${formatMoney(monthlyGoal)}/mo passive income`
              : 'set a monthly goal'
          }
        />
        <ResultCard
          icon={TrendingUp}
          label={`Projected at age ${retireAge || '—'}`}
          value={formatMoney(projected)}
          sub={years > 0 ? `over ${years} years @ ${plan.expectedReturn}%` : 'set current & retire age'}
          tone="emerald"
        />
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-slate-900">Progress to Freedom</h2>
          <span className="text-sm font-semibold text-slate-700">
            {progressPct.toFixed(1)}%
          </span>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${onTrack ? 'bg-blue-500' : 'bg-amber-500'}`}
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
        </div>
        {neededCorpus > 0 && (
          <p
            className={`mt-3 rounded-lg px-3 py-2 text-sm ${
              onTrack ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {onTrack
              ? `On track — projected to exceed your target by ${formatMoney(projected - neededCorpus)}.`
              : `Projected shortfall of ${formatMoney(shortfall)} by age ${retireAge || '—'}. Consider raising contributions, return, or retirement age.`}
          </p>
        )}
      </div>

      {/* Milestones */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="font-medium text-slate-900">Milestones</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-2">Milestone</th>
              <th className="px-5 py-2">Target</th>
              <th className="px-5 py-2">Projected Age Reached</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {milestones.map((m) => (
              <tr key={m.pct}>
                <td className="px-5 py-2.5 font-medium text-slate-800">{m.pct}%</td>
                <td className="px-5 py-2.5 text-slate-600">{formatMoney(m.target)}</td>
                <td className="px-5 py-2.5 text-slate-600">
                  {m.reachedAge === null
                    ? '—'
                    : currentAge > 0
                      ? `Age ${m.reachedAge}`
                      : `In ${m.reachedAge} yrs`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <input
        type="number"
        step="any"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
    </label>
  )
}

const TONES = { slate: 'text-slate-900', emerald: 'text-blue-600' }

function ResultCard({ icon: Icon, label, value, sub, tone = 'slate' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={16} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={`mt-2 text-2xl font-semibold ${TONES[tone]}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  )
}
