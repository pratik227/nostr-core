# NIP-44

ChaCha20 authenticated encryption with HMAC-SHA256 and padding.

## Import

```ts
import { nip44 } from 'nostr-core'
```

## nip44.getConversationKey

```ts
function getConversationKey(
  privkeyA: Uint8Array,
  pubkeyB: string
): Uint8Array
```

Pre-computes a shared conversation key using ECDH + HKDF-SHA256.

| Parameter | Type | Description |
|-----------|------|-------------|
| `privkeyA` | `Uint8Array` | Your secret key (32 bytes) |
| `pubkeyB` | `string` | Other party's public key (64-char hex) |

**Returns:** `Uint8Array` - 32-byte conversation key.

Compute this once per conversation partner and reuse it for all messages.

```ts
const convKey = nip44.getConversationKey(mySecretKey, recipientPubkey)
```

## nip44.encrypt

```ts
function encrypt(
  plaintext: string,
  conversationKey: Uint8Array,
  nonce?: Uint8Array
): string
```

Encrypts a message with ChaCha20 and authenticates with HMAC-SHA256.

| Parameter | Type | Description |
|-----------|------|-------------|
| `plaintext` | `string` | Message to encrypt |
| `conversationKey` | `Uint8Array` | Pre-computed conversation key |
| `nonce` | `Uint8Array?` | 32-byte nonce (random if omitted) |

**Returns:** `string` - base64-encoded payload.

The payload format is: `[version(1), nonce(32), ciphertext(?), mac(32)]`.

```ts
const convKey = nip44.getConversationKey(mySecretKey, recipientPubkey)
const payload = nip44.encrypt('Hello!', convKey)
```

## nip44.decrypt

```ts
function decrypt(
  payload: string,
  conversationKey: Uint8Array
): string
```

Decrypts and verifies a NIP-44 encrypted payload.

| Parameter | Type | Description |
|-----------|------|-------------|
| `payload` | `string` | Base64-encoded encrypted payload |
| `conversationKey` | `Uint8Array` | Pre-computed conversation key |

**Returns:** `string` - decrypted plaintext.

**Throws:** `Error` on:
- Invalid base64 encoding
- Unsupported version (must be `2`)
- MAC verification failure
- Invalid padding

```ts
const convKey = nip44.getConversationKey(mySecretKey, senderPubkey)
const plaintext = nip44.decrypt(payload, convKey)
```

## How It Works

1. Derives a shared point via ECDH
2. Extracts a 32-byte conversation key with HKDF (salt: `nip44-v2`)
3. Pads the plaintext to the next power of 2 (min 32 bytes) with a 2-byte length prefix
4. Derives per-message keys from the conversation key + nonce using HKDF-expand:
   - `chacha_key` (32 bytes)
   - `chacha_nonce` (12 bytes)
   - `hmac_key` (32 bytes)
5. Encrypts with ChaCha20
6. Computes HMAC-SHA256 over `nonce || ciphertext`
7. Encodes as `version || nonce || ciphertext || mac` in base64
