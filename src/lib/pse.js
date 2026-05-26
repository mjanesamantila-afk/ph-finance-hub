// Fetch live PSE prices through the allorigins CORS proxy.
// Primary source: PSELookup. Fallback: Yahoo Finance (.PS suffix).
const PROXY = 'https://api.allorigins.win/get?url='

async function fetchViaProxy(targetUrl) {
  const res = await fetch(PROXY + encodeURIComponent(targetUrl))
  if (!res.ok) throw new Error(`Proxy responded ${res.status}`)
  const wrapper = await res.json()
  if (!wrapper?.contents) throw new Error('Empty proxy response')
  return JSON.parse(wrapper.contents)
}

// PSELookup payloads vary across versions; probe the known shapes.
function extractPselookupPrice(data) {
  const candidates = [
    data?.price?.amount,
    data?.data?.price?.amount,
    data?.price,
    data?.data?.price,
    data?.last_traded_price,
  ]
  for (const c of candidates) {
    const n = Number(c)
    if (Number.isFinite(n) && n > 0) return n
  }
  return null
}

function extractYahooPrice(data) {
  const n = Number(data?.chart?.result?.[0]?.meta?.regularMarketPrice)
  return Number.isFinite(n) && n > 0 ? n : null
}

// Returns the latest price as a number, or null if both sources fail.
export async function fetchPsePrice(ticker) {
  const t = String(ticker || '').trim().toUpperCase()
  if (!t) return null

  try {
    const data = await fetchViaProxy(`https://pselookup.vrymel.com/api/stocks/${t}`)
    const price = extractPselookupPrice(data)
    if (price) return price
  } catch {
    // fall through to Yahoo
  }

  try {
    const data = await fetchViaProxy(
      `https://query1.finance.yahoo.com/v8/finance/chart/${t}.PS?interval=1d&range=1d`
    )
    const price = extractYahooPrice(data)
    if (price) return price
  } catch {
    // both failed
  }

  return null
}
