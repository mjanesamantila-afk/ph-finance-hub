// Fetch live PSE prices.
//
// The original PSELookup + allorigins + Yahoo Finance .PS stack stopped
// working in 2025/2026 (PSELookup is offline; Yahoo dropped .PS tickers).
// phisix-api3 publishes current Philippine stock data with CORS headers, so
// we can call it directly — no proxy needed.

const HOSTS = [
  'https://phisix-api3.appspot.com',
  'https://phisix-api4.appspot.com', // sometimes down, used as backup
]

function extractPrice(data) {
  const stock = data?.stocks?.[0]
  const n = Number(stock?.price?.amount)
  return Number.isFinite(n) && n > 0 ? n : null
}

export async function fetchPsePrice(ticker) {
  const t = String(ticker || '').trim().toUpperCase()
  if (!t) return null

  for (const host of HOSTS) {
    try {
      const res = await fetch(`${host}/stocks/${encodeURIComponent(t)}.json`)
      if (!res.ok) continue
      const price = extractPrice(await res.json())
      if (price) return price
    } catch {
      // try next host
    }
  }
  return null
}
