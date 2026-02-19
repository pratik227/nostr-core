import { LightningAddressError } from './types.js'
import type { LightningAddressResponse } from './types.js'

const LIGHTNING_ADDRESS_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/**
 * Validate whether a string is a valid Lightning Address format (name@domain).
 */
export function validateLightningAddress(address: string): boolean {
  return LIGHTNING_ADDRESS_REGEX.test(address)
}

/**
 * Parse a Lightning Address into its name and domain parts.
 * Throws LightningAddressError if the format is invalid.
 */
export function parseLightningAddress(address: string): { name: string; domain: string } {
  if (!validateLightningAddress(address)) {
    throw new LightningAddressError(`Invalid Lightning Address format: ${address}`)
  }
  const [name, domain] = address.split('@')
  return { name, domain }
}

/**
 * Resolve a Lightning Address to a BOLT-11 invoice via LNURL-pay.
 *
 * 1. Fetches the LNURL-pay metadata from `https://{domain}/.well-known/lnurlp/{name}`
 * 2. Validates the response (callback URL, min/max sendable)
 * 3. Calls the callback with `?amount={msats}` to obtain an invoice
 *
 * @param address - Lightning Address (e.g. `hello@getalby.com`)
 * @param amountSats - Amount in satoshis to request
 * @returns The BOLT-11 invoice string and any LNURL metadata
 */
export async function fetchInvoice(address: string, amountSats: number): Promise<LightningAddressResponse> {
  const { name, domain } = parseLightningAddress(address)

  if (amountSats <= 0 || !Number.isFinite(amountSats)) {
    throw new LightningAddressError('Amount must be a positive number of satoshis')
  }

  const amountMsats = amountSats * 1000

  // Step 1: Fetch LNURL-pay metadata
  const metadataUrl = `https://${domain}/.well-known/lnurlp/${name}`
  let lnurlPayResponse: Record<string, unknown>

  try {
    const res = await fetch(metadataUrl)
    if (!res.ok) {
      throw new LightningAddressError(
        `Failed to fetch LNURL-pay metadata from ${metadataUrl}: HTTP ${res.status}`,
      )
    }
    lnurlPayResponse = (await res.json()) as Record<string, unknown>
  } catch (err) {
    if (err instanceof LightningAddressError) throw err
    throw new LightningAddressError(
      `Failed to fetch LNURL-pay metadata from ${metadataUrl}: ${(err as Error).message}`,
    )
  }

  // Validate LNURL-pay response
  if (lnurlPayResponse.status === 'ERROR') {
    throw new LightningAddressError(
      `LNURL-pay error: ${(lnurlPayResponse.reason as string) || 'Unknown error'}`,
    )
  }

  const callback = lnurlPayResponse.callback as string | undefined
  const minSendable = lnurlPayResponse.minSendable as number | undefined
  const maxSendable = lnurlPayResponse.maxSendable as number | undefined

  if (!callback) {
    throw new LightningAddressError('Invalid LNURL-pay response: missing callback URL')
  }

  if (minSendable !== undefined && amountMsats < minSendable) {
    throw new LightningAddressError(
      `Amount ${amountSats} sats (${amountMsats} msats) is below minimum ${minSendable} msats`,
    )
  }

  if (maxSendable !== undefined && amountMsats > maxSendable) {
    throw new LightningAddressError(
      `Amount ${amountSats} sats (${amountMsats} msats) exceeds maximum ${maxSendable} msats`,
    )
  }

  // Step 2: Request invoice from callback
  const separator = callback.includes('?') ? '&' : '?'
  const invoiceUrl = `${callback}${separator}amount=${amountMsats}`
  let invoiceResponse: Record<string, unknown>

  try {
    const res = await fetch(invoiceUrl)
    if (!res.ok) {
      throw new LightningAddressError(`Failed to fetch invoice from callback: HTTP ${res.status}`)
    }
    invoiceResponse = (await res.json()) as Record<string, unknown>
  } catch (err) {
    if (err instanceof LightningAddressError) throw err
    throw new LightningAddressError(
      `Failed to fetch invoice from callback: ${(err as Error).message}`,
    )
  }

  if (invoiceResponse.status === 'ERROR') {
    throw new LightningAddressError(
      `LNURL-pay callback error: ${(invoiceResponse.reason as string) || 'Unknown error'}`,
    )
  }

  const pr = invoiceResponse.pr as string | undefined
  if (!pr) {
    throw new LightningAddressError('Invalid callback response: missing invoice (pr field)')
  }

  // Collect metadata from the LNURL-pay response
  const metadata: Record<string, unknown> = {}
  if (lnurlPayResponse.metadata) metadata.metadata = lnurlPayResponse.metadata
  if (lnurlPayResponse.commentAllowed) metadata.commentAllowed = lnurlPayResponse.commentAllowed
  if (lnurlPayResponse.allowsNostr) metadata.allowsNostr = lnurlPayResponse.allowsNostr
  if (lnurlPayResponse.nostrPubkey) metadata.nostrPubkey = lnurlPayResponse.nostrPubkey
  if (invoiceResponse.successAction) metadata.successAction = invoiceResponse.successAction
  if (invoiceResponse.routes) metadata.routes = invoiceResponse.routes

  return {
    invoice: pr,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  }
}
