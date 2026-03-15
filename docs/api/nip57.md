# NIP-57

Lightning Zaps - defines the protocol for sending Bitcoin Lightning payments (zaps) to Nostr users and events. Includes kind 9734 zap request events, kind 9735 zap receipt events, and LNURL invoice fetching.

## Import

```ts
import { nip57 } from 'nostr-core'
// or import individual functions
import {
  createZapRequestEventTemplate,
  createZapRequestEvent,
  parseZapReceipt,
  validateZapReceipt,
  fetchZapInvoice,
  ZapError,
} from 'nostr-core'
```

## ZapRequest Type

```ts
type ZapRequest = {
  recipientPubkey: string
  eventId?: string
  address?: string
  amount: number
  relays: string[]
  content?: string
  lnurl?: string
}
```

| Field | Type | Description |
|-------|------|-------------|
| `recipientPubkey` | `string` | Hex pubkey of the zap recipient |
| `eventId` | `string` (optional) | Event ID to zap (if zapping a specific event) |
| `address` | `string` (optional) | Replaceable event address to zap |
| `amount` | `number` | Amount in millisatoshis |
| `relays` | `string[]` | Relays where the zap receipt should be published |
| `content` | `string` (optional) | Zap comment message |
| `lnurl` | `string` (optional) | LNURL callback URL |

## ZapReceipt Type

```ts
type ZapReceipt = {
  recipientPubkey: string
  senderPubkey?: string
  eventId?: string
  amount: number
  bolt11: string
  description: string
  preimage?: string
}
```

| Field | Type | Description |
|-------|------|-------------|
| `recipientPubkey` | `string` | Hex pubkey of the zap recipient |
| `senderPubkey` | `string` (optional) | Hex pubkey of the zap sender (from embedded zap request) |
| `eventId` | `string` (optional) | Event ID that was zapped |
| `amount` | `number` | Amount in millisatoshis |
| `bolt11` | `string` | Lightning invoice (BOLT-11) |
| `description` | `string` | JSON string of the original zap request event |
| `preimage` | `string` (optional) | Payment preimage proof |

## ZapError Class

```ts
class ZapError extends Error {
  code: string
}
```

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Error code: `'ZAP_ERROR'`, `'INVALID_KIND'`, `'FETCH_ERROR'`, `'LNURL_ERROR'`, or `'MISSING_INVOICE'` |

## nip57.createZapRequestEventTemplate

```ts
function createZapRequestEventTemplate(request: ZapRequest): EventTemplate
```

Creates an unsigned kind 9734 zap request event template.

| Parameter | Type | Description |
|-----------|------|-------------|
| `request` | `ZapRequest` | Zap request parameters |

**Returns:** `EventTemplate` - Unsigned kind 9734 event with `p`, `amount`, `relays`, and optional `e`, `a`, `lnurl` tags.

```ts
const template = nip57.createZapRequestEventTemplate({
  recipientPubkey: 'recipient-pubkey-hex',
  amount: 21000,
  relays: ['wss://relay.example.com'],
  content: 'Great post!',
})

const signed = await signer.signEvent(template)
```

## nip57.createZapRequestEvent

```ts
function createZapRequestEvent(request: ZapRequest, secretKey: Uint8Array): NostrEvent
```

Creates and signs a kind 9734 zap request event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `request` | `ZapRequest` | Zap request parameters |
| `secretKey` | `Uint8Array` | Signer's secret key (32 bytes) |

**Returns:** `NostrEvent` - Signed kind 9734 zap request event.

```ts
const zapRequest = nip57.createZapRequestEvent(
  {
    recipientPubkey: 'recipient-pubkey-hex',
    eventId: 'event-to-zap-id',
    amount: 21000,
    relays: ['wss://relay.example.com'],
    content: 'Great post!',
  },
  secretKey,
)
```

## nip57.parseZapReceipt

```ts
function parseZapReceipt(event: NostrEvent): ZapReceipt
```

Parses a kind 9735 zap receipt event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NostrEvent` | A kind 9735 zap receipt event |

**Returns:** `ZapReceipt` - Parsed receipt with sender, recipient, amount, and invoice details.

**Throws:** `ZapError` with code `'INVALID_KIND'` if the event is not kind 9735.

```ts
const receipt = nip57.parseZapReceipt(zapReceiptEvent)
console.log(receipt)
// {
//   recipientPubkey: 'recipient-hex',
//   senderPubkey: 'sender-hex',
//   eventId: 'zapped-event-id',
//   amount: 21000,
//   bolt11: 'lnbc210n1...',
//   description: '{"kind":9734,...}',
//   preimage: 'abc123...'
// }
```

## nip57.validateZapReceipt

```ts
function validateZapReceipt(receipt: NostrEvent, request?: NostrEvent): boolean
```

Validates a kind 9735 zap receipt event. Checks that the event signature is valid, contains a valid embedded zap request in the `description` tag, and optionally matches a specific request.

| Parameter | Type | Description |
|-----------|------|-------------|
| `receipt` | `NostrEvent` | A kind 9735 zap receipt event |
| `request` | `NostrEvent` (optional) | The original zap request to verify against |

**Returns:** `boolean` - `true` if the receipt is valid.

```ts
const isValid = nip57.validateZapReceipt(receiptEvent)
console.log(isValid) // true

// Validate against a specific request
const matchesRequest = nip57.validateZapReceipt(receiptEvent, originalZapRequest)
```

## nip57.fetchZapInvoice

```ts
function fetchZapInvoice(opts: {
  lnurl: string
  zapRequest: NostrEvent
  amount: number
}): Promise<string>
```

Fetches a Lightning invoice from an LNURL callback, passing the signed zap request event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `opts.lnurl` | `string` | LNURL callback URL |
| `opts.zapRequest` | `NostrEvent` | Signed kind 9734 zap request event |
| `opts.amount` | `number` | Amount in millisatoshis |

**Returns:** `Promise<string>` - BOLT-11 Lightning invoice string.

**Throws:** `ZapError` with code `'FETCH_ERROR'`, `'LNURL_ERROR'`, or `'MISSING_INVOICE'`.

```ts
const invoice = await nip57.fetchZapInvoice({
  lnurl: 'https://getalby.com/lnurlp/alice/callback',
  zapRequest: signedZapRequest,
  amount: 21000,
})

console.log(invoice) // 'lnbc210n1...'
// Pass this invoice to a Lightning wallet for payment
```

## Full Example

```ts
import { generateSecretKey, getPublicKey, nip57, RelayPool } from 'nostr-core'

const sk = generateSecretKey()
const pk = getPublicKey(sk)
const pool = new RelayPool()

// Step 1: Create a zap request
const zapRequest = nip57.createZapRequestEvent(
  {
    recipientPubkey: 'recipient-pubkey-hex',
    eventId: 'note-to-zap-id',
    amount: 21000, // 21 sats in millisatoshis
    relays: ['wss://relay.example.com'],
    content: 'Great note, have some sats!',
  },
  sk,
)

// Step 2: Fetch the Lightning invoice from the LNURL callback
try {
  const invoice = await nip57.fetchZapInvoice({
    lnurl: 'https://wallet.example.com/lnurlp/user/callback',
    zapRequest,
    amount: 21000,
  })

  console.log('Pay this invoice:', invoice)
  // The user's Lightning wallet pays the invoice
} catch (err) {
  if (err instanceof nip57.ZapError) {
    console.error(`Zap error [${err.code}]: ${err.message}`)
  }
}

// Step 3: After payment, the LNURL service publishes a kind 9735 zap receipt
// Fetch zap receipts on an event
const receipts = await pool.querySync(
  ['wss://relay.example.com'],
  { kinds: [9735], '#e': ['note-to-zap-id'] },
)

let totalZapped = 0
for (const event of receipts) {
  // Validate the receipt
  if (!nip57.validateZapReceipt(event)) continue

  const receipt = nip57.parseZapReceipt(event)
  totalZapped += receipt.amount
  console.log(`Zap from ${receipt.senderPubkey}: ${receipt.amount / 1000} sats`)
}

console.log(`Total zapped: ${totalZapped / 1000} sats`)

pool.close()
```

## How It Works

- **Kind 9734** is a zap request event created by the sender and passed to the LNURL service
- **Kind 9735** is a zap receipt event created by the LNURL service after payment confirmation
- The flow is: create zap request -> fetch invoice from LNURL -> pay invoice -> service publishes receipt
- The zap request is embedded as JSON in the receipt's `description` tag for verification
- The `amount` tag in the zap request is in millisatoshis (1 sat = 1000 millisatoshis)
- The `relays` tag tells the LNURL service where to publish the zap receipt
- Zap receipts can target a specific event (via `e` tag) or a user profile (via `p` tag only)
- `validateZapReceipt` verifies the receipt signature and the embedded zap request signature
- The sender's pubkey is extracted from the embedded zap request, not from the receipt event itself
- The receipt's `pubkey` is the LNURL service's key, not the sender's
