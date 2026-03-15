# NIP-11

Relay Information Document - fetches metadata about a relay including its name, description, supported NIPs, software version, and operational limitations. Clients use this to discover relay capabilities before connecting.

## Import

```ts
import { nip11 } from 'nostr-core'
// or import individual functions
import {
  fetchRelayInfo,
  supportsNip,
  Nip11Error,
} from 'nostr-core'
```

## RelayInfo Type

```ts
type RelayInfo = {
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
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` (optional) | Human-readable relay name |
| `description` | `string` (optional) | Relay description |
| `pubkey` | `string` (optional) | Admin's public key (hex) |
| `contact` | `string` (optional) | Admin contact (email or URL) |
| `supported_nips` | `number[]` (optional) | List of supported NIP numbers |
| `software` | `string` (optional) | Relay software URL |
| `version` | `string` (optional) | Software version string |
| `limitation` | `object` (optional) | Operational limits (message size, subscriptions, etc.) |
| `relay_countries` | `string[]` (optional) | ISO country codes where the relay operates |
| `language_tags` | `string[]` (optional) | IETF language tags for content |
| `tags` | `string[]` (optional) | Searchable tags for the relay |
| `posting_policy` | `string` (optional) | URL to the relay's posting policy |

## Nip11Error Class

```ts
class Nip11Error extends Error {
  code: string
}
```

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Error code: `'FETCH_ERROR'` or `'NIP11_ERROR'` |

## nip11.fetchRelayInfo

```ts
function fetchRelayInfo(relayUrl: string): Promise<RelayInfo>
```

Fetches the relay information document. Converts `wss://` to `https://` and sends the request with `Accept: application/nostr+json`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `relayUrl` | `string` | Relay WebSocket URL (e.g., `wss://relay.example.com`) |

**Returns:** `Promise<RelayInfo>` - The relay's information document.

**Throws:** `Nip11Error` with code `'FETCH_ERROR'` if the request fails.

```ts
const info = await nip11.fetchRelayInfo('wss://relay.damus.io')
console.log(info.name)           // 'damus.io'
console.log(info.supported_nips) // [1, 2, 4, 9, 11, ...]
```

## nip11.supportsNip

```ts
function supportsNip(info: RelayInfo, nip: number): boolean
```

Checks if a relay supports a specific NIP number.

| Parameter | Type | Description |
|-----------|------|-------------|
| `info` | `RelayInfo` | Relay information document |
| `nip` | `number` | NIP number to check |

**Returns:** `boolean` - `true` if the relay lists the NIP in `supported_nips`.

```ts
const info = await nip11.fetchRelayInfo('wss://relay.damus.io')

if (nip11.supportsNip(info, 42)) {
  console.log('Relay supports NIP-42 authentication')
}

if (nip11.supportsNip(info, 50)) {
  console.log('Relay supports NIP-50 search')
}
```

## Full Example

```ts
import { nip11 } from 'nostr-core'

const relays = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
]

for (const url of relays) {
  try {
    const info = await nip11.fetchRelayInfo(url)
    console.log(`\n${info.name ?? url}`)
    console.log(`  Description: ${info.description ?? 'N/A'}`)
    console.log(`  Software: ${info.software ?? 'Unknown'} ${info.version ?? ''}`)
    console.log(`  Supported NIPs: ${info.supported_nips?.join(', ') ?? 'N/A'}`)

    if (info.limitation) {
      console.log(`  Max message length: ${info.limitation.max_message_length ?? 'unlimited'}`)
      console.log(`  Auth required: ${info.limitation.auth_required ?? false}`)
    }

    // Check for specific capabilities
    if (nip11.supportsNip(info, 9)) {
      console.log('  Supports event deletion (NIP-09)')
    }
    if (nip11.supportsNip(info, 40)) {
      console.log('  Supports channels (NIP-28)')
    }
  } catch (err) {
    if (err instanceof nip11.Nip11Error) {
      console.error(`Failed to fetch ${url}: [${err.code}] ${err.message}`)
    }
  }
}
```

## How It Works

- Relays serve a JSON document at their HTTP(S) endpoint with the `Accept: application/nostr+json` header
- The URL is derived by replacing `wss://` with `https://` (or `ws://` with `http://`)
- The `supported_nips` array lets clients determine which features a relay supports before connecting
- The `limitation` object describes operational constraints (max message size, subscription limits, etc.)
- `auth_required: true` in limitations means the relay requires NIP-42 authentication
- `payment_required: true` means the relay requires payment before accepting events
- Not all relays implement NIP-11 - handle fetch errors gracefully
