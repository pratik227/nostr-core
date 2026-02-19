# Wallet Operations

This guide covers every NWC method with parameters, return values, and examples.

## getInfo

Returns information about the connected wallet.

```ts
const info = await nwc.getInfo()
```

**Returns:** [`GetInfoResponse`](/api/types#getinforesponse)

| Field | Type | Description |
|-------|------|-------------|
| `alias` | `string` | Wallet name |
| `color` | `string` | Wallet color (hex) |
| `pubkey` | `string` | Wallet node pubkey |
| `network` | `string` | Network (e.g. `"mainnet"`) |
| `block_height` | `number` | Current block height |
| `block_hash` | `string` | Current block hash |
| `methods` | `string[]` | Supported NWC methods |
| `notifications` | `string[]` | Supported notification types (optional) |

::: tip
`getInfo` uses a 10-second reply timeout instead of the default 60 seconds.
:::

## getBalance

Returns the wallet balance in millisatoshis.

```ts
const { balance } = await nwc.getBalance()
console.log(`${balance} msats`)
```

**Returns:** [`GetBalanceResponse`](/api/types#getbalanceresponse)

| Field | Type | Description |
|-------|------|-------------|
| `balance` | `number` | Balance in msats |

## getBudget

Returns the remaining NWC spending budget.

```ts
const budget = await nwc.getBudget()
if (budget.total_budget) {
  console.log(`Used ${budget.used_budget} of ${budget.total_budget} msats`)
}
```

**Returns:** [`GetBudgetResponse`](/api/types#getbudgetresponse)

| Field | Type | Description |
|-------|------|-------------|
| `used_budget` | `number?` | Amount spent in current period |
| `total_budget` | `number?` | Total budget for the period |
| `renews_at` | `number?` | Unix timestamp of next renewal |
| `renewal_period` | `string?` | Budget period (e.g. `"monthly"`) |

## payInvoice

Pays a Lightning invoice.

```ts
const { preimage, fees_paid } = await nwc.payInvoice('lnbc...')
```

For zero-amount invoices, pass the amount in msats:

```ts
const { preimage } = await nwc.payInvoice('lnbc1...', 5000)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `invoice` | `string` | BOLT-11 invoice string |
| `amount` | `number?` | Amount in msats (for zero-amount invoices) |

**Returns:** [`PayResponse`](/api/types#payresponse)

| Field | Type | Description |
|-------|------|-------------|
| `preimage` | `string` | Payment preimage (proof of payment) |
| `fees_paid` | `number?` | Routing fees in msats |

## payKeysend

Sends a keysend payment directly to a node pubkey.

```ts
const { preimage } = await nwc.payKeysend({
  amount: 1000,
  pubkey: '03...destination_pubkey',
})
```

With TLV records (e.g. for podcasting 2.0):

```ts
const { preimage } = await nwc.payKeysend({
  amount: 1000,
  pubkey: '03...',
  tlv_records: [
    { type: 7629169, value: '...podcast_guid' },
  ],
})
```

**Parameters:** [`PayKeysendRequest`](/api/types#paykeysendrequest)

| Field | Type | Description |
|-------|------|-------------|
| `amount` | `number` | Amount in msats |
| `pubkey` | `string` | Destination node pubkey |
| `preimage` | `string?` | Custom preimage |
| `tlv_records` | `Array?` | TLV records `{ type, value }` |

**Returns:** [`PayResponse`](/api/types#payresponse)

## makeInvoice

Creates a Lightning invoice.

```ts
const tx = await nwc.makeInvoice({
  amount: 10000,
  description: 'Coffee payment',
  expiry: 3600,
})
console.log('Invoice:', tx.invoice)
```

**Parameters:** [`MakeInvoiceRequest`](/api/types#makeinvoicerequest)

| Field | Type | Description |
|-------|------|-------------|
| `amount` | `number` | Amount in msats |
| `description` | `string?` | Invoice description |
| `description_hash` | `string?` | SHA-256 hash of description |
| `expiry` | `number?` | Expiry in seconds |

**Returns:** [`Transaction`](/api/types#transaction)

## lookupInvoice

Looks up an invoice by payment hash or invoice string.

```ts
const tx = await nwc.lookupInvoice({ payment_hash: 'abc123...' })
// or
const tx = await nwc.lookupInvoice({ invoice: 'lnbc...' })
```

**Parameters:** [`LookupInvoiceRequest`](/api/types#lookupinvoicerequest)

| Field | Type | Description |
|-------|------|-------------|
| `payment_hash` | `string?` | Payment hash |
| `invoice` | `string?` | BOLT-11 invoice |

**Returns:** [`Transaction`](/api/types#transaction)

## listTransactions

Lists past transactions with optional filtering.

```ts
const { transactions } = await nwc.listTransactions({
  limit: 20,
  type: 'incoming',
})
for (const tx of transactions) {
  console.log(`${tx.type}: ${tx.amount} msats`)
}
```

**Parameters:** [`ListTransactionsRequest`](/api/types#listtransactionsrequest)

| Field | Type | Description |
|-------|------|-------------|
| `from` | `number?` | Start timestamp |
| `until` | `number?` | End timestamp |
| `limit` | `number?` | Max results |
| `offset` | `number?` | Pagination offset |
| `unpaid` | `boolean?` | Include unpaid invoices |
| `type` | `string?` | `'incoming'` or `'outgoing'` |

**Returns:** [`ListTransactionsResponse`](/api/types#listtransactionsresponse)

## signMessage

Signs a message with the wallet's key.

```ts
const { message, signature } = await nwc.signMessage('Hello, Nostr!')
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `message` | `string` | Message to sign |

**Returns:** [`SignMessageResponse`](/api/types#signmessageresponse)

| Field | Type | Description |
|-------|------|-------------|
| `message` | `string` | The signed message |
| `signature` | `string` | The signature |

## Notifications

NIP-47 notifications allow you to receive real-time events from the wallet (e.g. when a payment is received or sent). Notifications are delivered over Nostr event kinds `23196` (NIP-04 encryption) or `23197` (NIP-44 encryption).

### Using subscribeNotifications

The recommended approach returns an unsubscribe function and supports filtering by notification type:

```ts
const unsub = await nwc.subscribeNotifications((notification) => {
  const tx = notification.notification
  switch (notification.notification_type) {
    case 'payment_received':
      console.log(`Received ${tx.amount} msats`)
      break
    case 'payment_sent':
      console.log(`Sent ${tx.amount} msats, fees: ${tx.fees_paid}`)
      break
    case 'hold_invoice_accepted':
      console.log(`Hold invoice ${tx.payment_hash} accepted`)
      break
  }
})

// Stop listening when done:
unsub()
```

You can filter to only specific notification types:

```ts
const unsub = await nwc.subscribeNotifications(
  (notification) => {
    console.log(`Payment received: ${notification.notification.amount} msats`)
  },
  ['payment_received'],
)
```

### Using the Event Emitter

Alternatively, use the `on`/`off` event emitter pattern:

```ts
nwc.on('payment_received', (notification) => {
  const tx = notification.notification
  console.log(`Received ${tx.amount} msats`)
})

nwc.on('payment_sent', (notification) => {
  const tx = notification.notification
  console.log(`Sent ${tx.amount} msats, fees: ${tx.fees_paid}`)
})

nwc.on('hold_invoice_accepted', (notification) => {
  const tx = notification.notification
  console.log(`Hold invoice ${tx.payment_hash} accepted`)
})
```

Remove a handler:

```ts
nwc.off('payment_received', myHandler)
```

### Supported Notification Types

| Type | Description |
|------|-------------|
| `payment_received` | An incoming payment was received |
| `payment_sent` | An outgoing payment was completed |
| `hold_invoice_accepted` | A hold invoice was accepted by the payer |

See the [NWC API reference](/api/nwc) for full details on event handling.
