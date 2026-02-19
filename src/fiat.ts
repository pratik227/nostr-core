import { FiatConversionError } from './types.js'
import type { FiatRate, FiatConversion } from './types.js'

// Cache exchange rates for 60 seconds
const rateCache = new Map<string, { rate: number; timestamp: number }>()
const CACHE_TTL_MS = 60_000

export async function getExchangeRate(currency: string): Promise<FiatRate> {
  const key = currency.toLowerCase()
  const cached = rateCache.get(key)
  const now = Date.now()

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return { rate: cached.rate, currency: key, timestamp: cached.timestamp }
  }

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${key}`

  let response: Response
  try {
    response = await fetch(url)
  } catch (err) {
    throw new FiatConversionError(`Failed to fetch exchange rate: ${(err as Error).message}`)
  }

  if (!response.ok) {
    throw new FiatConversionError(`Exchange rate API returned ${response.status}`)
  }

  const data = await response.json()
  const rate = data?.bitcoin?.[key]

  if (typeof rate !== 'number' || rate <= 0) {
    throw new FiatConversionError(`Unsupported or invalid currency: ${currency}`)
  }

  const timestamp = now
  rateCache.set(key, { rate, timestamp })

  return { rate, currency: key, timestamp }
}

export async function fiatToSats(amount: number, currency: string): Promise<FiatConversion> {
  if (amount <= 0) {
    throw new FiatConversionError('Amount must be positive')
  }

  const { rate, currency: cur } = await getExchangeRate(currency)
  const sats = Math.round((amount / rate) * 1e8)

  return { sats, rate, currency: cur }
}

export async function satsToFiat(
  sats: number,
  currency: string,
): Promise<{ amount: number; rate: number; currency: string }> {
  if (sats <= 0) {
    throw new FiatConversionError('Sats must be positive')
  }

  const { rate, currency: cur } = await getExchangeRate(currency)
  const amount = (sats / 1e8) * rate

  return { amount, rate, currency: cur }
}
