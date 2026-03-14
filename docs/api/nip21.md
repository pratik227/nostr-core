# NIP-21

nostr: URI Scheme - provides utilities for encoding, decoding, and validating `nostr:` URIs. These URIs wrap NIP-19 bech32 entities (like `npub`, `note`, `nevent`, `nprofile`, `naddr`) into a standard URI format for use in links and content references.

## Import

```ts
import { nip21 } from 'nostr-core'
// or import individual functions
import {
  encodeNostrURI,
  decodeNostrURI,
  isNostrURI,
} from 'nostr-core'
```

## nip21.encodeNostrURI

```ts
function encodeNostrURI(nip19Entity: string): string
```

Encodes a NIP-19 bech32 entity as a `nostr:` URI.

| Parameter | Type | Description |
|-----------|------|-------------|
| `nip19Entity` | `string` | NIP-19 bech32 string (e.g., `npub1...`, `note1...`, `nevent1...`) |

**Returns:** `string` - A `nostr:` URI (e.g., `nostr:npub1...`).

```ts
const uri = nip21.encodeNostrURI('npub1abc123...')
console.log(uri) // 'nostr:npub1abc123...'

const eventUri = nip21.encodeNostrURI('nevent1def456...')
console.log(eventUri) // 'nostr:nevent1def456...'
```

## nip21.decodeNostrURI

```ts
function decodeNostrURI(uri: string): DecodedResult
```

Decodes a `nostr:` URI into a NIP-19 decoded result containing the type and data.

| Parameter | Type | Description |
|-----------|------|-------------|
| `uri` | `string` | A `nostr:` URI string |

**Returns:** `DecodedResult` - NIP-19 decoded object with `type` and `data` fields.

**Throws:** `Error` if the URI does not start with `nostr:` or the bech32 entity is invalid.

```ts
const result = nip21.decodeNostrURI('nostr:npub1abc123...')
console.log(result.type) // 'npub'
console.log(result.data) // hex pubkey

const eventResult = nip21.decodeNostrURI('nostr:nevent1def456...')
console.log(eventResult.type) // 'nevent'
console.log(eventResult.data) // { id, relays, author, kind }
```

## nip21.isNostrURI

```ts
function isNostrURI(str: string): boolean
```

Checks if a string is a valid `nostr:` URI.

| Parameter | Type | Description |
|-----------|------|-------------|
| `str` | `string` | String to test |

**Returns:** `boolean` - `true` if the string matches the `nostr:` URI pattern.

```ts
nip21.isNostrURI('nostr:npub1abc123...')   // true
nip21.isNostrURI('nostr:note1def456...')   // true
nip21.isNostrURI('https://example.com')    // false
nip21.isNostrURI('npub1abc123...')          // false (missing nostr: prefix)
```

## Full Example

```ts
import { nip19, nip21 } from 'nostr-core'

// Encode a pubkey as a nostr: URI
const npub = nip19.npubEncode('abc123...hex...')
const uri = nip21.encodeNostrURI(npub)
console.log(uri) // 'nostr:npub1...'

// Encode a note event as a nostr: URI with relay hints
const nevent = nip19.neventEncode({
  id: 'event-id-hex',
  relays: ['wss://relay.example.com'],
})
const eventUri = nip21.encodeNostrURI(nevent)
console.log(eventUri) // 'nostr:nevent1...'

// Validate a URI
if (nip21.isNostrURI(eventUri)) {
  const decoded = nip21.decodeNostrURI(eventUri)

  switch (decoded.type) {
    case 'npub':
      console.log('Public key:', decoded.data)
      break
    case 'note':
      console.log('Note ID:', decoded.data)
      break
    case 'nevent':
      console.log('Event ID:', decoded.data.id)
      console.log('Relays:', decoded.data.relays)
      break
    case 'nprofile':
      console.log('Profile pubkey:', decoded.data.pubkey)
      break
    case 'naddr':
      console.log('Address:', decoded.data.identifier)
      break
  }
}
```

## How It Works

- The `nostr:` URI scheme wraps NIP-19 bech32-encoded entities into a standard URI format
- Supported entity types: `npub`, `nprofile`, `note`, `nevent`, `naddr`, `nsec`
- Encoding simply prepends `nostr:` to a bech32 string
- Decoding strips the `nostr:` prefix and delegates to NIP-19 `decode()`
- Clients render `nostr:` URIs as clickable links to profiles, notes, or events
- Content text (kind 1 notes, long-form articles) uses `nostr:` URIs to reference other Nostr entities inline
- The validation regex ensures the URI contains a valid bech32 character set
