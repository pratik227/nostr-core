# NIP-19

Bech32 encoding and decoding for Nostr identifiers (`npub`, `nsec`, `note`, `nprofile`, `nevent`, `naddr`).

## Import

```ts
import { nip19 } from 'nostr-core'
```

## decode

```ts
function decode(code: string): DecodedResult
```

Decodes any NIP-19 bech32-encoded string.

| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | `string` | Bech32-encoded string |

**Returns:** `DecodedResult` - typed union based on the prefix.

**Throws:** `Error` on invalid format or missing required fields.

```ts
const result = nip19.decode('npub1...')

switch (result.type) {
  case 'npub':
    console.log('Public key:', result.data) // hex string
    break
  case 'nsec':
    console.log('Secret key:', result.data) // Uint8Array
    break
  case 'note':
    console.log('Event ID:', result.data) // hex string
    break
  case 'nprofile':
    console.log('Pubkey:', result.data.pubkey)
    console.log('Relays:', result.data.relays)
    break
  case 'nevent':
    console.log('Event ID:', result.data.id)
    console.log('Author:', result.data.author)
    break
  case 'naddr':
    console.log('Identifier:', result.data.identifier)
    console.log('Pubkey:', result.data.pubkey)
    console.log('Kind:', result.data.kind)
    break
}
```

### DecodedResult

```ts
type DecodedResult =
  | { type: 'npub'; data: string }
  | { type: 'nsec'; data: Uint8Array }
  | { type: 'note'; data: string }
  | { type: 'nprofile'; data: ProfilePointer }
  | { type: 'nevent'; data: EventPointer }
  | { type: 'naddr'; data: AddressPointer }
```

## nsecEncode

```ts
function nsecEncode(key: Uint8Array): string
```

Encodes a secret key as an `nsec1...` string.

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `Uint8Array` | 32-byte secret key |

**Returns:** `string` - bech32-encoded `nsec1...`

## npubEncode

```ts
function npubEncode(hex: string): string
```

Encodes a public key as an `npub1...` string.

| Parameter | Type | Description |
|-----------|------|-------------|
| `hex` | `string` | 64-char hex public key |

**Returns:** `string` - bech32-encoded `npub1...`

## noteEncode

```ts
function noteEncode(hex: string): string
```

Encodes an event ID as a `note1...` string.

| Parameter | Type | Description |
|-----------|------|-------------|
| `hex` | `string` | 64-char hex event ID |

**Returns:** `string` - bech32-encoded `note1...`

## nprofileEncode

```ts
function nprofileEncode(profile: ProfilePointer): string
```

Encodes a profile pointer with optional relay hints.

| Parameter | Type | Description |
|-----------|------|-------------|
| `profile` | `ProfilePointer` | Profile data |

```ts
const encoded = nip19.nprofileEncode({
  pubkey: '3bf0c63f...',
  relays: ['wss://relay.example.com'],
})
```

## neventEncode

```ts
function neventEncode(event: EventPointer): string
```

Encodes an event pointer with optional relay hints, author, and kind.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `EventPointer` | Event data |

```ts
const encoded = nip19.neventEncode({
  id: 'abc123...',
  relays: ['wss://relay.example.com'],
  author: '3bf0c63f...',
  kind: 1,
})
```

## naddrEncode

```ts
function naddrEncode(addr: AddressPointer): string
```

Encodes a replaceable event address.

| Parameter | Type | Description |
|-----------|------|-------------|
| `addr` | `AddressPointer` | Address data |

```ts
const encoded = nip19.naddrEncode({
  identifier: 'my-article',
  pubkey: '3bf0c63f...',
  kind: 30023,
  relays: ['wss://relay.example.com'],
})
```

## Pointer Types

### ProfilePointer

```ts
type ProfilePointer = {
  pubkey: string
  relays?: string[]
}
```

### EventPointer

```ts
type EventPointer = {
  id: string
  relays?: string[]
  author?: string
  kind?: number
}
```

### AddressPointer

```ts
type AddressPointer = {
  identifier: string
  pubkey: string
  kind: number
  relays?: string[]
}
```
