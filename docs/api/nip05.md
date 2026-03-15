# NIP-05

DNS-Based Verification - maps a human-readable internet identifier (`name@domain`) to a Nostr public key by querying a `/.well-known/nostr.json` file on the domain. Clients use this to verify that a user controls a given domain or is recognized by it.

## Import

```ts
import { nip05 } from 'nostr-core'
// or import individual functions
import {
  parseNip05Address,
  queryNip05,
  verifyNip05,
  Nip05Error,
} from 'nostr-core'
```

## Nip05Result Type

```ts
type Nip05Result = {
  pubkey: string
  relays?: string[]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `pubkey` | `string` | Hex public key associated with the address |
| `relays` | `string[]` (optional) | Relay URLs the user prefers, if provided by the server |

## Nip05Error Class

```ts
class Nip05Error extends Error {
  code: string
}
```

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Error code: `'INVALID_ADDRESS'`, `'FETCH_ERROR'`, or `'NOT_FOUND'` |

## nip05.parseNip05Address

```ts
function parseNip05Address(address: string): { name: string; domain: string }
```

Parses a NIP-05 address into its name and domain components.

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | `string` | NIP-05 address in `name@domain` format |

**Returns:** `{ name: string; domain: string }` - Parsed name and domain parts.

**Throws:** `Nip05Error` with code `'INVALID_ADDRESS'` if the format is invalid.

```ts
const { name, domain } = nip05.parseNip05Address('bob@example.com')
console.log(name)   // 'bob'
console.log(domain) // 'example.com'
```

## nip05.queryNip05

```ts
function queryNip05(address: string): Promise<Nip05Result>
```

Queries a NIP-05 address by fetching `https://<domain>/.well-known/nostr.json?name=<name>` and returns the associated public key and optional relay list.

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | `string` | NIP-05 address in `name@domain` format |

**Returns:** `Promise<Nip05Result>` - The public key and optional relays for the address.

**Throws:** `Nip05Error` with code `'INVALID_ADDRESS'`, `'FETCH_ERROR'`, or `'NOT_FOUND'`.

```ts
const result = await nip05.queryNip05('bob@example.com')
console.log(result)
// {
//   pubkey: 'abc123...hex',
//   relays: ['wss://relay.example.com']
// }
```

## nip05.verifyNip05

```ts
function verifyNip05(address: string, expectedPubkey: string): Promise<boolean>
```

Verifies that a NIP-05 address resolves to the expected public key. Returns `false` instead of throwing on errors.

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | `string` | NIP-05 address in `name@domain` format |
| `expectedPubkey` | `string` | Hex public key to verify against |

**Returns:** `Promise<boolean>` - `true` if the address resolves to the expected pubkey, `false` otherwise.

```ts
const isValid = await nip05.verifyNip05('bob@example.com', userPubkey)
if (isValid) {
  console.log('NIP-05 verified!')
}
```

## Full Example

```ts
import { nip05, getPublicKey, generateSecretKey } from 'nostr-core'

const sk = generateSecretKey()
const pk = getPublicKey(sk)

// Parse an address
const { name, domain } = nip05.parseNip05Address('alice@nostr.example')
console.log(`Looking up ${name} on ${domain}`)

// Query the address
try {
  const result = await nip05.queryNip05('alice@nostr.example')
  console.log(`Found pubkey: ${result.pubkey}`)

  if (result.relays) {
    console.log(`Preferred relays: ${result.relays.join(', ')}`)
  }

  // Verify a specific user's NIP-05
  const verified = await nip05.verifyNip05('alice@nostr.example', result.pubkey)
  console.log(`Verification: ${verified}`) // true
} catch (err) {
  if (err instanceof nip05.Nip05Error) {
    console.error(`NIP-05 error [${err.code}]: ${err.message}`)
  }
}
```

## How It Works

- A NIP-05 address has the format `name@domain`, similar to an email address
- The client fetches `https://<domain>/.well-known/nostr.json?name=<name>` via HTTP GET
- The JSON response contains a `names` object mapping names to hex public keys
- Optionally, a `relays` object maps public keys to arrays of relay URLs
- Verification checks that the returned pubkey matches the expected one
- The special name `_` represents the domain root (e.g., `_@example.com` means just `example.com`)
- Clients should re-verify NIP-05 addresses periodically since domain owners can change mappings
