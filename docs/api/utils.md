# Utils

Utility functions and constants exported by nostr-core.

## Import

```ts
import {
  normalizeURL,
  bytesToHex,
  hexToBytes,
  randomBytes,
  utf8Encoder,
  utf8Decoder,
} from 'nostr-core'
```

## normalizeURL

```ts
function normalizeURL(url: string): string
```

Normalizes a relay URL for consistent comparison.

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | `string` | Relay URL |

**Returns:** `string` - normalized WebSocket URL.

**Throws:** `Error` with message `'Invalid URL: <url>'` if parsing fails.

Normalization rules:
- `http://` → `ws://`, `https://` → `wss://`
- Adds `wss://` if no protocol specified
- Removes trailing slashes from pathname
- Removes default ports (80 for `ws://`, 443 for `wss://`)
- Sorts query parameters
- Removes URL fragments

```ts
normalizeURL('relay.example.com')
// 'wss://relay.example.com'

normalizeURL('https://relay.example.com/')
// 'wss://relay.example.com'

normalizeURL('ws://relay.example.com:80')
// 'ws://relay.example.com'
```

## bytesToHex

```ts
function bytesToHex(bytes: Uint8Array): string
```

Converts a byte array to a hex string.

| Parameter | Type | Description |
|-----------|------|-------------|
| `bytes` | `Uint8Array` | Byte array |

**Returns:** `string` - hex-encoded string.

Re-exported from `@noble/hashes/utils`.

```ts
bytesToHex(new Uint8Array([0xde, 0xad]))
// 'dead'
```

## hexToBytes

```ts
function hexToBytes(hex: string): Uint8Array
```

Converts a hex string to a byte array.

| Parameter | Type | Description |
|-----------|------|-------------|
| `hex` | `string` | Hex-encoded string |

**Returns:** `Uint8Array`

Re-exported from `@noble/hashes/utils`.

```ts
hexToBytes('dead')
// Uint8Array [ 0xde, 0xad ]
```

## randomBytes

```ts
function randomBytes(len: number): Uint8Array
```

Generates cryptographically secure random bytes.

| Parameter | Type | Description |
|-----------|------|-------------|
| `len` | `number` | Number of bytes |

**Returns:** `Uint8Array`

Re-exported from `@noble/hashes/utils`.

```ts
randomBytes(32)
// Uint8Array(32) [ ... ]
```

## utf8Encoder

```ts
const utf8Encoder: TextEncoder
```

Global `TextEncoder` instance for UTF-8 encoding.

```ts
utf8Encoder.encode('Hello')
// Uint8Array [ 72, 101, 108, 108, 111 ]
```

## utf8Decoder

```ts
const utf8Decoder: TextDecoder
```

Global `TextDecoder` instance for UTF-8 decoding.

```ts
utf8Decoder.decode(new Uint8Array([72, 101, 108, 108, 111]))
// 'Hello'
```
