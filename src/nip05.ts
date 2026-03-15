export type Nip05Result = {
  pubkey: string
  relays?: string[]
}

export class Nip05Error extends Error {
  code: string
  constructor(message: string, code = 'NIP05_ERROR') {
    super(message)
    this.name = 'Nip05Error'
    this.code = code
  }
}

/**
 * Parse a NIP-05 address into name and domain parts.
 */
export function parseNip05Address(address: string): { name: string; domain: string } {
  const match = address.match(/^([^@]+)@([^@]+)$/)
  if (!match) throw new Nip05Error(`Invalid NIP-05 address: ${address}`, 'INVALID_ADDRESS')
  return { name: match[1], domain: match[2] }
}

/**
 * Query a NIP-05 address and return the associated pubkey and relays.
 */
export async function queryNip05(address: string): Promise<Nip05Result> {
  const { name, domain } = parseNip05Address(address)

  const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`
  let json: Record<string, unknown>

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Nip05Error(`HTTP ${res.status} from ${domain}`, 'FETCH_ERROR')
    json = (await res.json()) as Record<string, unknown>
  } catch (err) {
    if (err instanceof Nip05Error) throw err
    throw new Nip05Error(`Failed to query ${domain}: ${(err as Error).message}`, 'FETCH_ERROR')
  }

  const names = json.names as Record<string, string> | undefined
  if (!names || !names[name]) {
    throw new Nip05Error(`Name "${name}" not found on ${domain}`, 'NOT_FOUND')
  }

  const pubkey = names[name]
  const relaysMap = json.relays as Record<string, string[]> | undefined
  const relays = relaysMap?.[pubkey]

  return { pubkey, relays }
}

/**
 * Verify that a NIP-05 address resolves to the expected pubkey.
 */
export async function verifyNip05(address: string, expectedPubkey: string): Promise<boolean> {
  try {
    const result = await queryNip05(address)
    return result.pubkey === expectedPubkey
  } catch {
    return false
  }
}
