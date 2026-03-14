import { finalizeEvent, verifyEvent, type NostrEvent, type EventTemplate } from './event.js'

export type ZapRequest = {
  recipientPubkey: string
  eventId?: string
  address?: string
  amount: number
  relays: string[]
  content?: string
  lnurl?: string
}

export type ZapReceipt = {
  recipientPubkey: string
  senderPubkey?: string
  eventId?: string
  amount: number
  bolt11: string
  description: string
  preimage?: string
}

export class ZapError extends Error {
  code: string
  constructor(message: string, code = 'ZAP_ERROR') {
    super(message)
    this.name = 'ZapError'
    this.code = code
  }
}

/**
 * Create a kind 9734 zap request event template (unsigned).
 */
export function createZapRequestEventTemplate(request: ZapRequest): EventTemplate {
  const tags: string[][] = [
    ['p', request.recipientPubkey],
    ['amount', String(request.amount)],
    ['relays', ...request.relays],
  ]

  if (request.eventId) tags.push(['e', request.eventId])
  if (request.address) tags.push(['a', request.address])
  if (request.lnurl) tags.push(['lnurl', request.lnurl])

  return {
    kind: 9734,
    tags,
    content: request.content ?? '',
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create and sign a kind 9734 zap request event.
 */
export function createZapRequestEvent(request: ZapRequest, secretKey: Uint8Array): NostrEvent {
  return finalizeEvent(createZapRequestEventTemplate(request), secretKey)
}

/**
 * Parse a kind 9735 zap receipt event.
 */
export function parseZapReceipt(event: NostrEvent): ZapReceipt {
  if (event.kind !== 9735) throw new ZapError('Expected kind 9735 zap receipt', 'INVALID_KIND')

  let recipientPubkey = ''
  let senderPubkey: string | undefined
  let eventId: string | undefined
  let bolt11 = ''
  let description = ''
  let preimage: string | undefined
  let amount = 0

  for (const tag of event.tags) {
    switch (tag[0]) {
      case 'p':
        recipientPubkey = tag[1]
        break
      case 'bolt11':
        bolt11 = tag[1]
        break
      case 'description':
        description = tag[1]
        break
      case 'preimage':
        preimage = tag[1]
        break
      case 'e':
        eventId = tag[1]
        break
    }
  }

  // Extract sender pubkey from the description (zap request)
  if (description) {
    try {
      const zapRequest = JSON.parse(description) as NostrEvent
      senderPubkey = zapRequest.pubkey
      const amountTag = zapRequest.tags.find(t => t[0] === 'amount')
      if (amountTag) amount = parseInt(amountTag[1], 10)
    } catch {
      // Invalid description JSON
    }
  }

  return { recipientPubkey, senderPubkey, eventId, amount, bolt11, description, preimage }
}

/**
 * Validate a kind 9735 zap receipt event.
 */
export function validateZapReceipt(receipt: NostrEvent, request?: NostrEvent): boolean {
  if (receipt.kind !== 9735) return false
  if (!verifyEvent(receipt)) return false

  const descriptionTag = receipt.tags.find(t => t[0] === 'description')
  if (!descriptionTag?.[1]) return false

  let zapRequest: NostrEvent
  try {
    zapRequest = JSON.parse(descriptionTag[1]) as NostrEvent
  } catch {
    return false
  }

  if (!verifyEvent(zapRequest)) return false
  if (zapRequest.kind !== 9734) return false

  // If a specific request was provided, verify it matches
  if (request) {
    if (zapRequest.id !== request.id) return false
  }

  return true
}

/**
 * Fetch a zap invoice from an LNURL callback.
 */
export async function fetchZapInvoice(opts: {
  lnurl: string
  zapRequest: NostrEvent
  amount: number
}): Promise<string> {
  const separator = opts.lnurl.includes('?') ? '&' : '?'
  const url = `${opts.lnurl}${separator}amount=${opts.amount}&nostr=${encodeURIComponent(JSON.stringify(opts.zapRequest))}`

  let json: Record<string, unknown>
  try {
    const res = await fetch(url)
    if (!res.ok) throw new ZapError(`HTTP ${res.status} from LNURL callback`, 'FETCH_ERROR')
    json = (await res.json()) as Record<string, unknown>
  } catch (err) {
    if (err instanceof ZapError) throw err
    throw new ZapError(`Failed to fetch zap invoice: ${(err as Error).message}`, 'FETCH_ERROR')
  }

  if (json.status === 'ERROR') {
    throw new ZapError(`LNURL error: ${(json.reason as string) || 'Unknown'}`, 'LNURL_ERROR')
  }

  const pr = json.pr as string | undefined
  if (!pr) throw new ZapError('Missing invoice in LNURL response', 'MISSING_INVOICE')

  return pr
}
