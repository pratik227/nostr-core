export type RelayInfo = {
  name?: string
  description?: string
  pubkey?: string
  contact?: string
  supported_nips?: number[]
  software?: string
  version?: string
  limitation?: {
    max_message_length?: number
    max_subscriptions?: number
    max_filters?: number
    max_limit?: number
    max_subid_length?: number
    max_event_tags?: number
    max_content_length?: number
    min_pow_difficulty?: number
    auth_required?: boolean
    payment_required?: boolean
    [key: string]: unknown
  }
  relay_countries?: string[]
  language_tags?: string[]
  tags?: string[]
  posting_policy?: string
  [key: string]: unknown
}

export class Nip11Error extends Error {
  code: string
  constructor(message: string, code = 'NIP11_ERROR') {
    super(message)
    this.name = 'Nip11Error'
    this.code = code
  }
}

/**
 * Fetch relay information document (NIP-11).
 * Converts wss:// to https:// and fetches with Accept: application/nostr+json.
 */
export async function fetchRelayInfo(relayUrl: string): Promise<RelayInfo> {
  let httpUrl = relayUrl.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://')
  if (!httpUrl.startsWith('http')) {
    httpUrl = `https://${httpUrl}`
  }

  try {
    const res = await fetch(httpUrl, {
      headers: { Accept: 'application/nostr+json' },
    })
    if (!res.ok) throw new Nip11Error(`HTTP ${res.status} from ${relayUrl}`, 'FETCH_ERROR')
    return (await res.json()) as RelayInfo
  } catch (err) {
    if (err instanceof Nip11Error) throw err
    throw new Nip11Error(`Failed to fetch relay info from ${relayUrl}: ${(err as Error).message}`, 'FETCH_ERROR')
  }
}

/**
 * Check if a relay supports a specific NIP number.
 */
export function supportsNip(info: RelayInfo, nip: number): boolean {
  return info.supported_nips?.includes(nip) ?? false
}
