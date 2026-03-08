---
name: wallet-monitor
description: Monitor a Lightning wallet in real-time and analyze transaction history using nostr-core. Subscribe to payment notifications, query and filter transactions, create invoices for receiving payments, and build payment analytics.
user-invocable: true
argument-hint: "[listen, history, create-invoice, or time range]"
---

# Wallet Monitoring & Analytics with nostr-core

You are helping the user monitor their Lightning wallet, track transaction history, receive payments, and analyze payment data using **nostr-core**.

**Prerequisites:** The user must have nostr-core installed and an NWC connection established. If not, use the `/nwc-integrate` skill first.

---

## Creating Invoices (Receiving Payments)

```typescript
const tx = await nwc.makeInvoice({
  amount: 10000,               // millisatoshis (10 sats)
  description: 'Coffee payment',
  expiry: 3600,                // seconds (1 hour)
})

console.log('Invoice:', tx.invoice)          // BOLT-11 string to share
console.log('Payment hash:', tx.payment_hash) // Track payment status
console.log('Expires:', new Date(tx.expires_at * 1000))
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | `number` | Yes | Amount in millisatoshis |
| `description` | `string` | No | Human-readable description |
| `description_hash` | `string` | No | SHA-256 hash of description |
| `expiry` | `number` | No | Expiry in seconds |

**Returns:** A `Transaction` object with `invoice`, `payment_hash`, `amount`, `state: 'pending'`, `created_at`, `expires_at`.

Display the invoice string to the user so they can share it or encode it as a QR code.

---

## Looking Up Invoice Status

Check if an invoice has been paid:

```typescript
// By payment hash
const tx = await nwc.lookupInvoice({ payment_hash: 'abc123...' })

// Or by invoice string
const tx = await nwc.lookupInvoice({ invoice: 'lnbc...' })

if (tx.state === 'settled') {
  console.log('Paid!', tx.preimage)
  console.log('Settled at:', new Date(tx.settled_at * 1000))
} else {
  console.log('Status:', tx.state) // 'pending' or 'failed'
}
```

**Transaction states:** `pending`, `settled`, `failed`

---

## Transaction History

### Basic query

```typescript
const { transactions } = await nwc.listTransactions({ limit: 20 })
for (const tx of transactions) {
  console.log(`${tx.type} | ${tx.state} | ${tx.amount} msats | ${tx.description}`)
}
```

### Filter by type

```typescript
// Only incoming payments
const { transactions: received } = await nwc.listTransactions({
  type: 'incoming',
  limit: 50,
})

// Only outgoing payments
const { transactions: sent } = await nwc.listTransactions({
  type: 'outgoing',
  limit: 50,
})
```

### Filter by time range

```typescript
const oneDayAgo = Math.floor(Date.now() / 1000) - 86400

const { transactions } = await nwc.listTransactions({
  from: oneDayAgo,       // unix timestamp - start
  until: Math.floor(Date.now() / 1000), // unix timestamp - end
})
```

### Pagination

```typescript
const pageSize = 20
let offset = 0
let allTransactions = []

while (true) {
  const { transactions } = await nwc.listTransactions({
    limit: pageSize,
    offset,
  })
  allTransactions.push(...transactions)
  if (transactions.length < pageSize) break
  offset += pageSize
}
```

### Include unpaid invoices

```typescript
const { transactions } = await nwc.listTransactions({
  unpaid: true,  // Include pending/expired invoices
})
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | `number` | No | Start unix timestamp |
| `until` | `number` | No | End unix timestamp |
| `limit` | `number` | No | Max results per page |
| `offset` | `number` | No | Pagination offset |
| `unpaid` | `boolean` | No | Include unpaid invoices |
| `type` | `string` | No | `"incoming"` or `"outgoing"` |

---

## Real-Time Notifications

### Event Emitter Pattern

Register handlers before or after `connect()`:

```typescript
nwc.on('payment_received', (notification) => {
  const tx = notification.notification
  console.log(`Received ${tx.amount} msats: ${tx.description}`)
})

nwc.on('payment_sent', (notification) => {
  const tx = notification.notification
  console.log(`Sent ${tx.amount} msats (fees: ${tx.fees_paid} msats)`)
})

// Remove a specific handler
nwc.off('payment_received', myHandler)
```

### Subscription Pattern

More control with filtering and an unsubscribe function:

```typescript
const unsub = await nwc.subscribeNotifications(
  (notification) => {
    console.log(notification.notification_type)  // 'payment_received' | 'payment_sent'
    console.log(notification.notification.amount) // amount in msats
  },
  ['payment_received'] // Only subscribe to specific types
)

// Later: stop listening
unsub()
```

**Notification types:**
| Type | Description |
|------|-------------|
| `payment_received` | Incoming payment settled |
| `payment_sent` | Outgoing payment completed |

The notification handler receives a `Nip47Notification` object:
```typescript
{
  notification_type: 'payment_received' | 'payment_sent',
  notification: Transaction  // Same shape as listTransactions entries
}
```

---

## Signing Messages

Prove wallet ownership or create attestations:

```typescript
const { message, signature } = await nwc.signMessage('Hello, Nostr!')
console.log('Signature:', signature)
```

---

## Analytics Patterns

### Daily summary

```typescript
const startOfDay = new Date()
startOfDay.setHours(0, 0, 0, 0)

const { transactions } = await nwc.listTransactions({
  from: Math.floor(startOfDay.getTime() / 1000),
})

const received = transactions.filter(tx => tx.type === 'incoming' && tx.state === 'settled')
const sent = transactions.filter(tx => tx.type === 'outgoing' && tx.state === 'settled')

const totalReceived = received.reduce((sum, tx) => sum + tx.amount, 0)
const totalSent = sent.reduce((sum, tx) => sum + tx.amount, 0)
const totalFees = sent.reduce((sum, tx) => sum + (tx.fees_paid ?? 0), 0)

console.log(`Today: +${totalReceived} msats received, -${totalSent} msats sent, ${totalFees} msats in fees`)
console.log(`Net: ${totalReceived - totalSent} msats`)
```

### Convert to fiat for display

```typescript
import { satsToFiat } from 'nostr-core'

const balanceSats = Math.floor(balance / 1000)
const balanceUsd = await satsToFiat(balanceSats, 'usd')
console.log(`Balance: ${balanceSats} sats (~$${balanceUsd.toFixed(2)} USD)`)
```

### Payment frequency

```typescript
const { transactions } = await nwc.listTransactions({ limit: 100 })
const settled = transactions.filter(tx => tx.state === 'settled')

if (settled.length >= 2) {
  const newest = settled[0].settled_at
  const oldest = settled[settled.length - 1].settled_at
  const days = (newest - oldest) / 86400
  console.log(`${settled.length} payments over ${days.toFixed(1)} days`)
  console.log(`Average: ${(settled.length / days).toFixed(1)} payments/day`)
}
```
