# nostr-core

Dead-simple, vendor-neutral [Nostr Wallet Connect (NWC)](https://github.com/nostr-protocol/nips/blob/master/47.md) client for JavaScript and TypeScript.

```ts
import { NWC } from 'nostr-core'

const nwc = new NWC('nostr+walletconnect://...')
await nwc.connect()

const { balance } = await nwc.getBalance()
console.log(`Balance: ${balance} msats`)

const { preimage } = await nwc.payInvoice('lnbc...')
console.log('Paid! Preimage:', preimage)

nwc.close()
```

## Features

- **Single connection string** - pass a `nostr+walletconnect://` URI and start making calls
- **Full NIP-47 coverage** - `pay_invoice`, `get_balance`, `make_invoice`, `list_transactions`, `pay_keysend`, `sign_message`, and more
- **Auto-encryption** - detects NIP-04 or NIP-44 support and handles it transparently
- **Typed errors** - specific error classes for timeouts, connection failures, wallet rejections, and decryption issues
- **Zero framework deps** - built on audited [noble](https://paulmillr.com/noble/) cryptography libraries only
- **ESM-only** - tree-shakeable, modern JavaScript

## Install

```sh
npm install nostr-core
```

Requires Node.js 18+ or any runtime with Web Crypto and WebSocket support (Deno, Bun, Cloudflare Workers).

## Quick Start

### Connect to a Wallet

```ts
import { NWC } from 'nostr-core'

const nwc = new NWC('nostr+walletconnect://...')
await nwc.connect()

const info = await nwc.getInfo()
console.log('Connected to:', info.alias)
console.log('Methods:', info.methods)
```

### Pay an Invoice

```ts
try {
  const { preimage, fees_paid } = await nwc.payInvoice('lnbc...')
  console.log('Preimage:', preimage)
} catch (err) {
  console.error('Payment failed:', err.message)
}
```

### Pay a Lightning Address

```ts
try {
  const { preimage, invoice } = await nwc.payLightningAddress('hello@getalby.com', 100)
  console.log('Paid 100 sats! Preimage:', preimage)
} catch (err) {
  console.error('Payment failed:', err.message)
}
```

### Pay a Lightning Address in Fiat

```ts
// Pay $5 USD to a Lightning Address - automatically converts to sats
const { preimage, sats, rate } = await nwc.payLightningAddressFiat('hello@getalby.com', 5, 'usd')
console.log(`Paid ${sats} sats ($5 at $${rate}/BTC)`)
```

### Create an Invoice

```ts
const tx = await nwc.makeInvoice({
  amount: 10000, // msats
  description: 'Coffee',
})
console.log('Invoice:', tx.invoice)
```

### Listen for Payments

```ts
nwc.on('payment_received', (notification) => {
  console.log('Received:', notification.notification.amount, 'msats')
})
```

### Close

```ts
nwc.close()
```

## API

### NWC Methods

| Method | Description |
|--------|-------------|
| `connect()` | Connect to relay, auto-detect encryption |
| `getInfo()` | Wallet metadata (alias, network, supported methods) |
| `getBalance()` | Wallet balance in msats |
| `getBudget()` | NWC spending budget info |
| `payInvoice(invoice, amount?)` | Pay a BOLT-11 invoice |
| `payKeysend(params)` | Keysend payment to a node pubkey |
| `makeInvoice(params)` | Create a Lightning invoice |
| `lookupInvoice(params)` | Look up an invoice by hash or string |
| `listTransactions(params?)` | List past transactions |
| `signMessage(message)` | Sign a message with the wallet's key |
| `payLightningAddress(address, amountSats)` | Resolve a Lightning Address and pay the invoice |
| `payLightningAddressFiat(address, fiatAmount, currency)` | Convert fiat to sats and pay a Lightning Address |
| `on(event, handler)` | Listen for `payment_received` / `payment_sent` |
| `off(event, handler)` | Remove an event handler |
| `close()` | Disconnect and clean up |

### Configuration

```ts
const nwc = new NWC(connectionString)
nwc.replyTimeout = 30000   // Wallet reply timeout (default: 60s)
nwc.publishTimeout = 10000 // Relay publish timeout (default: 5s)
```

### Error Handling

```ts
import { NWCWalletError, NWCTimeoutError, NWCConnectionError } from 'nostr-core'

try {
  await nwc.payInvoice('lnbc...')
} catch (err) {
  if (err instanceof NWCWalletError) {
    console.error(`Wallet rejected [${err.code}]: ${err.message}`)
  } else if (err instanceof NWCTimeoutError) {
    console.error('Timed out:', err.code) // 'PUBLISH_TIMEOUT' or 'REPLY_TIMEOUT'
  } else if (err instanceof NWCConnectionError) {
    console.error('Connection lost')
  }
}
```

Error hierarchy:

```
NWCError (code: string)
├── NWCWalletError          - wallet rejected the request
├── NWCTimeoutError         - generic timeout
│   ├── NWCPublishTimeoutError  - relay didn't acknowledge
│   └── NWCReplyTimeoutError    - wallet didn't respond
├── NWCPublishError         - relay rejected the event
├── NWCConnectionError      - couldn't connect to relay
├── NWCDecryptionError      - couldn't decrypt response
├── LightningAddressError   - Lightning Address resolution failed
└── FiatConversionError     - fiat-to-sats conversion failed
```

## Low-Level Exports

nostr-core also exports the building blocks used internally:

```ts
import {
  // Key management
  generateSecretKey, getPublicKey,

  // Events
  finalizeEvent, verifyEvent, getEventHash, serializeEvent, validateEvent,

  // Relay connections
  Relay, RelayPool,

  // Encryption
  nip04, nip44,

  // Bech32 encoding
  nip19,

  // Filters
  matchFilter, matchFilters,

  // Utilities
  normalizeURL, bytesToHex, hexToBytes, randomBytes,
} from 'nostr-core'
```

## Why nostr-core over @getalby/sdk?

If you've used `@getalby/sdk` before, here's why `nostr-core` is a better fit for most NWC use cases:

| | **nostr-core** | **@getalby/sdk** | |
|---|---|---|---|
| **Install size** | 118 MB | 159 MB | **26% smaller** |
| **Packages installed** | 79 | 436 | **82% fewer** |
| **Dependency tree** | 132 total | 698 total | **81% fewer** |
| **Vendor lock-in** | None - pure NIP-47 protocol | Coupled to Alby (OAuth, webhooks, branding) | |
| **Error handling** | Typed hierarchy (8 specific classes) | Generic errors | |
| **Encryption** | Auto-detects NIP-04 / NIP-44 | Manual configuration | |
| **Fiat conversion** | Built-in (zero extra deps) | Via `@getalby/lightning-tools` | |
| **Runtime support** | Node 18+, Deno, Bun, Cloudflare Workers | Primarily Node.js | |
| **API surface** | One class (`NWC`) | Multiple overlapping abstractions | |

**Use `@getalby/sdk`** if you need Alby OAuth or WebLN compatibility. **Use `nostr-core`** for everything else - including Lightning Address payments and fiat currency conversion, which are now supported natively.

See the full [comparison guide](./docs/guide/comparison.md) for details.

## Dependencies

| Package | Purpose |
|---------|---------|
| [@noble/curves](https://github.com/paulmillr/noble-curves) | secp256k1 / schnorr signatures |
| [@noble/hashes](https://github.com/paulmillr/noble-hashes) | SHA-256, HMAC, HKDF |
| [@noble/ciphers](https://github.com/paulmillr/noble-ciphers) | AES-CBC, ChaCha20 |
| [@scure/base](https://github.com/paulmillr/scure-base) | Base64, bech32 encoding |

## License

[MIT](./LICENSE)
