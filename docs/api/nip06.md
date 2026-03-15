# NIP-06

Key Derivation from Mnemonic - derives Nostr key pairs from BIP-39 mnemonic seed phrases using the BIP-32 HD key derivation path `m/44'/1237'/account'/0/0`. This allows users to back up and restore their Nostr identity with a standard 12 or 24-word mnemonic.

## Import

```ts
import { nip06 } from 'nostr-core'
// or import individual functions
import {
  generateMnemonic,
  validateMnemonic,
  mnemonicToKey,
  deriveKey,
  getDerivationPath,
} from 'nostr-core'
```

## DerivedKey Type

```ts
type DerivedKey = {
  secretKey: Uint8Array
  publicKey: string
}
```

| Field | Type | Description |
|-------|------|-------------|
| `secretKey` | `Uint8Array` | 32-byte secret key |
| `publicKey` | `string` | Hex-encoded Schnorr public key (x-only) |

## nip06.getDerivationPath

```ts
function getDerivationPath(accountIndex: number): string
```

Returns the BIP-44 derivation path for Nostr keys at a given account index.

| Parameter | Type | Description |
|-----------|------|-------------|
| `accountIndex` | `number` | Account index (0-based) |

**Returns:** `string` - Derivation path in the format `m/44'/1237'/account'/0/0`.

```ts
const path = nip06.getDerivationPath(0)
console.log(path) // "m/44'/1237'/0'/0/0"

const path2 = nip06.getDerivationPath(1)
console.log(path2) // "m/44'/1237'/1'/0/0"
```

## nip06.generateMnemonic

```ts
function generateMnemonic(wordCount?: 12 | 24): string
```

Generates a new BIP-39 mnemonic phrase.

| Parameter | Type | Description |
|-----------|------|-------------|
| `wordCount` | `12 \| 24` (optional) | Number of words. Defaults to `12` |

**Returns:** `string` - A BIP-39 mnemonic phrase (space-separated words).

```ts
const mnemonic12 = nip06.generateMnemonic()
console.log(mnemonic12) // "abandon ability able about above absent ..."

const mnemonic24 = nip06.generateMnemonic(24)
console.log(mnemonic24.split(' ').length) // 24
```

## nip06.validateMnemonic

```ts
function validateMnemonic(mnemonic: string): boolean
```

Validates whether a string is a valid BIP-39 mnemonic phrase.

| Parameter | Type | Description |
|-----------|------|-------------|
| `mnemonic` | `string` | Mnemonic phrase to validate |

**Returns:** `boolean` - `true` if the mnemonic is valid, `false` otherwise.

```ts
const valid = nip06.validateMnemonic('abandon ability able about above absent ...')
console.log(valid) // true

const invalid = nip06.validateMnemonic('not a valid mnemonic')
console.log(invalid) // false
```

## nip06.mnemonicToKey

```ts
function mnemonicToKey(mnemonic: string, accountIndex?: number, passphrase?: string): DerivedKey
```

Derives a Nostr key pair from a BIP-39 mnemonic phrase.

| Parameter | Type | Description |
|-----------|------|-------------|
| `mnemonic` | `string` | BIP-39 mnemonic phrase |
| `accountIndex` | `number` (optional) | Account index for derivation. Defaults to `0` |
| `passphrase` | `string` (optional) | Optional BIP-39 passphrase. Defaults to `''` |

**Returns:** `DerivedKey` - Derived secret key and public key.

**Throws:** `Error` if the mnemonic is invalid.

```ts
const mnemonic = nip06.generateMnemonic()
const key = nip06.mnemonicToKey(mnemonic)
console.log(key.publicKey) // hex pubkey

// Derive a second account
const key2 = nip06.mnemonicToKey(mnemonic, 1)

// With passphrase
const key3 = nip06.mnemonicToKey(mnemonic, 0, 'my-passphrase')
```

## nip06.deriveKey

```ts
function deriveKey(seed: Uint8Array, accountIndex?: number): DerivedKey
```

Derives a Nostr key pair from a BIP-32 seed directly.

| Parameter | Type | Description |
|-----------|------|-------------|
| `seed` | `Uint8Array` | BIP-32 master seed bytes |
| `accountIndex` | `number` (optional) | Account index for derivation. Defaults to `0` |

**Returns:** `DerivedKey` - Derived secret key and public key.

**Throws:** `Error` if key derivation fails.

```ts
// If you already have a seed from another source
const key = nip06.deriveKey(seedBytes, 0)
console.log(key.publicKey)
```

## Full Example

```ts
import { nip06, finalizeEvent } from 'nostr-core'

// Generate a new mnemonic and derive keys
const mnemonic = nip06.generateMnemonic()
console.log('Backup these words:', mnemonic)

// Derive the first account
const { secretKey, publicKey } = nip06.mnemonicToKey(mnemonic)
console.log('Public key:', publicKey)

// Sign an event with the derived key
const event = finalizeEvent(
  {
    kind: 1,
    tags: [],
    content: 'Hello from a mnemonic-derived key!',
    created_at: Math.floor(Date.now() / 1000),
  },
  secretKey,
)

// Derive multiple accounts from the same mnemonic
for (let i = 0; i < 3; i++) {
  const key = nip06.mnemonicToKey(mnemonic, i)
  console.log(`Account ${i}: ${key.publicKey}`)
}

// Later, restore from backup
const isValid = nip06.validateMnemonic(mnemonic)
if (isValid) {
  const restored = nip06.mnemonicToKey(mnemonic)
  console.log('Restored pubkey:', restored.publicKey)
}
```

## How It Works

- Uses **BIP-39** to generate and validate mnemonic phrases (12 or 24 English words)
- Converts the mnemonic to a seed using PBKDF2 with an optional passphrase
- Derives keys using **BIP-32** HD key derivation with the Nostr-specific path `m/44'/1237'/account'/0/0`
- The coin type `1237` is registered for Nostr in SLIP-44
- Account index `0` is the default; increment for additional identities from the same mnemonic
- The same mnemonic + passphrase + account index always produces the same key pair
- Users should store their mnemonic securely offline as it can regenerate all derived keys
