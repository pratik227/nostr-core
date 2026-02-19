# Crypto

Key generation and derivation functions.

## Import

```ts
import { generateSecretKey, getPublicKey } from 'nostr-core'
```

## generateSecretKey

```ts
function generateSecretKey(): Uint8Array
```

Generates a random secp256k1 secret key using the schnorr scheme.

**Returns:** `Uint8Array` - 32-byte secret key.

```ts
const sk = generateSecretKey()
// Uint8Array(32) [ ... ]
```

## getPublicKey

```ts
function getPublicKey(secretKey: Uint8Array): string
```

Derives the public key from a secret key.

| Parameter | Type | Description |
|-----------|------|-------------|
| `secretKey` | `Uint8Array` | 32-byte secret key |

**Returns:** `string` - 64-character hex-encoded public key (x-only, no `02` prefix).

```ts
const sk = generateSecretKey()
const pk = getPublicKey(sk)
// '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d'
```

## Example

```ts
import { generateSecretKey, getPublicKey, nip19 } from 'nostr-core'

const sk = generateSecretKey()
const pk = getPublicKey(sk)

console.log('nsec:', nip19.nsecEncode(sk))
console.log('npub:', nip19.npubEncode(pk))
```
