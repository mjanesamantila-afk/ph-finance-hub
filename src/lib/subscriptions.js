import { supabase } from './supabase'
import { clampDay } from './dates'

function toRow(values) {
  return {
    name: values.name,
    amount: values.amount === '' ? 0 : Number(values.amount),
    cycle: values.cycle || 'monthly',
    payment_method: values.payment_method || null,
    renewal_date: values.renewal_date || null,
    active: values.active !== false,
  }
}

export async function createSubscription(userId, values) {
  const { error } = await supabase
    .from('subscriptions')
    .insert({ ...toRow(values), user_id: userId })
  if (error) throw error
}

export async function updateSubscription(id, values) {
  const { error } = await supabase.from('subscriptions').update(toRow(values)).eq('id', id)
  if (error) throw error
}

export async function deleteSubscription(id) {
  const { error } = await supabase.from('subscriptions').delete().eq('id', id)
  if (error) throw error
}

// Normalize to a monthly cost (yearly subscriptions ÷ 12).
export function monthlyCost(sub) {
  const a = Number(sub?.amount) || 0
  return sub?.cycle === 'yearly' ? a / 12 : a
}

export function yearlyCost(sub) {
  const a = Number(sub?.amount) || 0
  return sub?.cycle === 'yearly' ? a : a * 12
}

// Next renewal date for a subscription (recurring from its renewal_date).
// Monthly = same day of month each month; yearly = same date each year.
export function nextRenewal(sub, from = new Date()) {
  if (!sub?.renewal_date) return null
  const base = new Date(sub.renewal_date)
  if (Number.isNaN(base.getTime())) return null
  const y = from.getFullYear()
  const m = from.getMonth()
  const today = new Date(y, m, from.getDate())

  if (sub.cycle === 'yearly') {
    const bm = base.getMonth()
    const bd = base.getDate()
    let candidate = new Date(y, bm, clampDay(y, bm, bd))
    if (candidate < today) candidate = new Date(y + 1, bm, clampDay(y + 1, bm, bd))
    return candidate
  }

  // monthly
  const day = base.getDate()
  let candidate = new Date(y, m, clampDay(y, m, day))
  if (candidate < today) {
    const nm = m === 11 ? 0 : m + 1
    const ny = m === 11 ? y + 1 : y
    candidate = new Date(ny, nm, clampDay(ny, nm, day))
  }
  return candidate
}
