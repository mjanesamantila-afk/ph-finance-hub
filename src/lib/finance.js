// ---- Money formatting -------------------------------------------------------
// PHP for local holdings, USD for GoTrade — never auto-convert between them.
export function formatMoney(amount, currency = 'PHP') {
  const n = Number(amount) || 0
  const symbol = currency === 'USD' ? '$' : '₱'
  return `${symbol}${n.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// ---- Stop loss --------------------------------------------------------------
// Best available "current price per share": last refreshed price, else derived
// from current_value / shares.
export function currentPricePerShare(holding) {
  const last = Number(holding?.last_price)
  if (Number.isFinite(last) && last > 0) return last
  const shares = Number(holding?.shares)
  const cv = Number(holding?.current_value)
  if (shares > 0 && Number.isFinite(cv) && cv > 0) return cv / shares
  return 0
}

// Breach: currentPricePerShare <= entryPrice * (1 - stopLossPct/100)
export function isBreached(holding, globalStopLoss = 10) {
  const entry = Number(holding?.price_per_share)
  const price = currentPricePerShare(holding)
  if (!entry || !price) return false
  const pct = Number(holding?.stop_loss_pct ?? globalStopLoss)
  return price <= entry * (1 - pct / 100)
}

export function countBreaches(holdings = [], globalStopLoss = 10) {
  return holdings.filter((h) => isBreached(h, globalStopLoss)).length
}

// ---- Derived per-holding metrics -------------------------------------------
export function deriveHolding(holding, globalStopLoss = 10) {
  const shares = Number(holding?.shares) || 0
  const entry = Number(holding?.price_per_share) || 0
  const lastPrice = Number(holding?.last_price) || 0

  const invested = Number(holding?.invested) || shares * entry
  const currentValue =
    Number(holding?.current_value) || (lastPrice ? shares * lastPrice : invested)

  const price = currentPricePerShare(holding)
  const gain = currentValue - invested
  const gainPct = invested ? (gain / invested) * 100 : 0

  const pct = Number(holding?.stop_loss_pct ?? globalStopLoss)
  const stopPrice = entry > 0 ? entry * (1 - pct / 100) : 0
  const breached = entry > 0 && price > 0 && price <= stopPrice

  return {
    shares,
    entry,
    invested,
    currentValue,
    currentPrice: price,
    gain,
    gainPct,
    stopLossPct: pct,
    stopPrice,
    breached,
  }
}
