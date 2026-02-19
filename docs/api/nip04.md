# NIP-04

AES-256-CBC encryption for Nostr direct messages (legacy).

::: warning
NIP-04 is considered legacy. For new applications, prefer [NIP-44](/api/nip44) which provides authenticated encryption and padding.
:::

## Import

```ts
import { nip04 } from 'nostr-core'
```

## nip04.encrypt

```ts
function encrypt(
  secretKey: string | Uint8Array,
  pubkey: string,
  text: string
): string
```

Encrypts a message using AES-256-CBC with a shared secret derived via ECDH.

| Parameter | Type | Description |
|-----------|------|-------------|
| `secretKey` | `string \| Uint8Array` | Your secret key (hex string or 32 bytes) |
| `pubkey` | `string` | Recipient's public key (64-char hex) |
| `text` | `string` | Plaintext message |

**Returns:** `string` - encrypted payload in the format `<base64_ciphertext>?iv=<base64_iv>`.

```ts
const ciphertext = nip04.encrypt(mySecretKey, recipientPubkey, 'Hello!')
// 'dGVzdA==?iv=AAAAAAAAAAAAAAAAAAAAAA=='
```

## nip04.decrypt

```ts
function decrypt(
  secretKey: string | Uint8Array,
  pubkey: string,
  data: string
): string
```

Decrypts a NIP-04 encrypted message.

| Parameter | Type | Description |
|-----------|------|-------------|
| `secretKey` | `string \| Uint8Array` | Your secret key (hex string or 32 bytes) |
| `pubkey` | `string` | Sender's public key (64-char hex) |
| `data` | `string` | Encrypted payload (`ciphertext?iv=iv`) |

**Returns:** `string` - decrypted plaintext.

**Throws:** `Error` on decryption failure.

```ts
const plaintext = nip04.decrypt(mySecretKey, senderPubkey, ciphertext)
```

## How It Works

1. Computes a shared secret via ECDH (`secp256k1.getSharedSecret`)
2. Uses bytes 1–32 of the shared point as the AES key
3. Generates a random 16-byte IV
4. Encrypts with AES-256-CBC
5. Returns `base64(ciphertext)?iv=base64(iv)`
