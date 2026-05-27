import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { DIGITAL_BANKS } from '../config/constants'
import { countBreaches } from '../lib/finance'
import { nextDueDate, daysUntil, monthKeyFromDate } from '../lib/dates'
import { useAuth } from './AuthContext'

const DUE_SOON_DAYS = 7

const DataContext = createContext(null)

// On first login: ensure a user_settings row exists and seed the 4 digital
// banks at ₱0. Safe to call repeatedly — only inserts what's missing.
async function bootstrapUser(userId) {
  const { data: settingsRow } = await supabase
    .from('user_settings')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!settingsRow) {
    await supabase.from('user_settings').insert({ user_id: userId })
  }

  const { data: banks } = await supabase
    .from('digital_banks')
    .select('bank_name')
    .eq('user_id', userId)

  const existing = new Set((banks ?? []).map((b) => b.bank_name))
  const missing = DIGITAL_BANKS.filter((name) => !existing.has(name)).map((name) => ({
    user_id: userId,
    bank_name: name,
    balance: 0,
  }))

  if (missing.length) {
    await supabase.from('digital_banks').insert(missing)
  }
}

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [holdings, setHoldings] = useState([])
  const [settings, setSettings] = useState(null)
  const [digitalBanks, setDigitalBanks] = useState([])
  const [ledgerEntries, setLedgerEntries] = useState([])
  const [spendBudgets, setSpendBudgets] = useState([])
  const [bankTransactions, setBankTransactions] = useState([])
  const [interestHistory, setInterestHistory] = useState([])
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false)
      return
    }
    const [
      holdingsRes,
      settingsRes,
      banksRes,
      ledgerRes,
      budgetsRes,
      txnsRes,
      interestRes,
      billsRes,
    ] = await Promise.all([
      supabase.from('holdings').select('*').eq('user_id', user.id),
      supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('digital_banks').select('*').eq('user_id', user.id).order('bank_name'),
      supabase
        .from('ledger_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false }),
      supabase.from('spend_budgets').select('*').eq('user_id', user.id),
      supabase
        .from('bank_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false }),
      supabase.from('interest_history').select('*').eq('user_id', user.id),
      supabase.from('bills').select('*').eq('user_id', user.id).order('due_day'),
    ])
    setHoldings(holdingsRes.data ?? [])
    setSettings(settingsRes.data ?? null)
    setDigitalBanks(banksRes.data ?? [])
    setLedgerEntries(ledgerRes.data ?? [])
    setSpendBudgets(budgetsRes.data ?? [])
    setBankTransactions(txnsRes.data ?? [])
    setInterestHistory(interestRes.data ?? [])
    setBills(billsRes.data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    let active = true
    async function init() {
      if (!user || !isSupabaseConfigured) {
        setLoading(false)
        return
      }
      setLoading(true)
      await bootstrapUser(user.id)
      if (active) await refetch()
    }
    init()
    return () => {
      active = false
    }
  }, [user, refetch])

  // Persist a patch to user_settings (optimistic local update).
  const updateSettings = useCallback(
    async (patch) => {
      if (!user || !isSupabaseConfigured) return
      setSettings((prev) => ({ ...(prev ?? { user_id: user.id }), ...patch }))
      const { error } = await supabase
        .from('user_settings')
        .update(patch)
        .eq('user_id', user.id)
      if (error) throw error
    },
    [user]
  )

  const globalStopLoss = settings?.global_stop_loss ?? 10
  const breachCount = useMemo(
    () => countBreaches(holdings, globalStopLoss),
    [holdings, globalStopLoss]
  )

  // Bills due within the next week (active only) — drives the nav reminder badge.
  const billsDueSoon = useMemo(
    () =>
      bills.filter((b) => {
        if (b.active === false) return false
        const due = nextDueDate(b.due_day)
        if ((b.paid_months || []).includes(monthKeyFromDate(due))) return false
        const d = daysUntil(due)
        return d >= 0 && d <= DUE_SOON_DAYS
      }).length,
    [bills]
  )

  const value = {
    holdings,
    settings,
    digitalBanks,
    ledgerEntries,
    spendBudgets,
    bankTransactions,
    interestHistory,
    bills,
    loading,
    breachCount,
    billsDueSoon,
    globalStopLoss,
    refetch,
    updateSettings,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within a DataProvider')
  return ctx
}
