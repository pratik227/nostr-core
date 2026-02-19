# Encryption

NWC messages are encrypted between your app and the wallet. nostr-core supports both encryption standards and auto-detects which one to use.

## NIP-04 vs NIP-44

| | NIP-04 | NIP-44 |
|---|--------|--------|
| **Algorithm** | AES-256-CBC | ChaCha20 + HMAC-SHA256 |
| **Status** | Legacy (widely supported) | Modern (recommended) |
| **Padding** | None | Power-of-2 padding |
| **Authentication** | None (encrypt-only) | HMAC authenticated |
| **Format** | `base64?iv=base64` | Single base64 blob |

NIP-44 is the preferred standard - it provides authenticated encryption and hides message length via padding. However, many wallets still only support NIP-04.

## Auto-Detection

When you call `nwc.connect()`, nostr-core automatically detects which encryption the wallet supports:

1. Queries the wallet's **service info event** (kind `13194`)
2. Checks if the content includes `nip44` in the supported methods
3. Uses NIP-44 if available, falls back to NIP-04

You don't need to configure anything - encryption is handled transparently.

```ts
const nwc = new NWC(connectionString)
await nwc.connect() // Encryption auto-detected here
await nwc.getBalance() // Request/response encrypted automatically
```

## Using NIP-04 Directly

If you're building custom Nostr applications, you can use the encryption modules directly:

```ts
import { nip04 } from 'nostr-core'

const ciphertext = nip04.encrypt(mySecretKey, recipientPubkey, 'Hello!')
const plaintext = nip04.decrypt(mySecretKey, senderPubkey, ciphertext)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `secretKey` | `string \| Uint8Array` | Your secret key (hex or bytes) |
| `pubkey` | `string` | Other party's public key (hex) |
| `text` / `data` | `string` | Plaintext or ciphertext |

See the [NIP-04 API reference](/api/nip04) for details.

## Using NIP-44 Directly

NIP-44 uses a pre-computed **conversation key** for efficiency:

```ts
import { nip44 } from 'nostr-core'

// Pre-compute the shared key (do this once per conversation)
const convKey = nip44.getConversationKey(mySecretKey, recipientPubkey)

// Encrypt and decrypt
const ciphertext = nip44.encrypt('Hello!', convKey)
const plaintext = nip44.decrypt(ciphertext, convKey)
```

See the [NIP-44 API reference](/api/nip44) for details.

## Decryption Errors

If a response can't be decrypted, nostr-core throws an `NWCDecryptionError`:

```ts
import { NWCDecryptionError } from 'nostr-core'

try {
  await nwc.getBalance()
} catch (err) {
  if (err instanceof NWCDecryptionError) {
    console.error('Decryption failed:', err.message)
    // err.code === 'DECRYPTION_ERROR'
  }
}
```

This typically indicates a key mismatch or corrupted data.
