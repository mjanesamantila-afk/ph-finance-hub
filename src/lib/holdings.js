import { supabase } from './supabase'
import { fetchPsePrice } from './pse'

// Whitelist of columns we write, so stray form/derived fields never hit the DB.
function toRow(values) {
  return {
    type: values.type,
    broker: values.broker || null,
    name: values.name,
    ticker: values.ticker || null,
    shares: values.shares === '' ? null : Number(values.shares),
    price_per_share:
      values.price_per_share === '' ? null : Number(values.price_per_share),
    invested: values.invested === '' ? null : Number(values.invested),
    current_value:
      values.current_value === '' ? null : Number(values.current_value),
    last_price: values.last_price === '' ? null : Number(values.last_price),
    date_added: values.date_added || null,
    stop_loss_pct:
      values.stop_loss_pct === '' ? null : Number(values.stop_loss_pct),
    currency: values.currency || 'PHP',
  }
}

export async function createHolding(userId, values) {
  const { error } = await supabase
    .from('holdings')
    .insert({ ...toRow(values), user_id: userId })
  if (error) throw error
}

export async function updateHolding(id, values) {
  const { error } = await supabase.from('holdings').update(toRow(values)).eq('id', id)
  if (error) throw error
}

export async function deleteHolding(id) {
  const { error } = await supabase.from('holdings').delete().eq('id', id)
  if (error) throw error
}

// Refresh one holding's price from PSE/Yahoo and recompute current_value.
// Returns { ok, price } so the caller can surface a failure.
export async function refreshHoldingPrice(holding) {
  if (!holding.ticker) return { ok: false, price: null }
  const price = await fetchPsePrice(holding.ticker)
  if (!price) return { ok: false, price: null }

  const shares = Number(holding.shares) || 0
  const update = {
    last_price: price,
    last_refreshed: new Date().toISOString(),
  }
  if (shares > 0) update.current_value = shares * price

  const { error } = await supabase.from('holdings').update(update).eq('id', holding.id)
  if (error) throw error
  return { ok: true, price }
}
