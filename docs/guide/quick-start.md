# Quick Start

This guide walks you through connecting to a wallet and making your first operations.

## Get a Connection String

Your NWC-compatible wallet will provide a connection string that looks like:

```
nostr+walletconnect://walletpubkey?relay=wss://relay.example.com&secret=hex_or_nsec
```

:::tip Where to find it
Most wallets have an "NWC" or "Nostr Wallet Connect" section in their settings where you can generate one.
:::

## Connect and Query

```ts
import { NWC } from 'nostr-core'

const connectionString = 'nostr+walletconnect://...'

// Create client and connect
const nwc = new NWC(connectionString)
await nwc.connect()

// Check wallet info
const info = await nwc.getInfo()
console.log('Connected to:', info.alias)
console.log('Supported methods:', info.methods)

// Check balance
const { balance } = await nwc.getBalance()
console.log(`Balance: ${balance} msats`)

// Always close when done
nwc.close()
```

## Pay an Invoice

```ts
const nwc = new NWC(connectionString)
await nwc.connect()

try {
  const { preimage } = await nwc.payInvoice('lnbc...')
  console.log('Paid! Preimage:', preimage)
} catch (err) {
  console.error('Payment failed:', err.message)
} finally {
  nwc.close()
}
```

:::warning Always handle errors
Payment operations can fail for many reasons (insufficient balance, expired invoice, wallet offline). Always wrap them in try/catch. See [Error Handling](/guide/error-handling) for details.
:::

## Create an Invoice

```ts
const nwc = new NWC(connectionString)
await nwc.connect()

const invoice = await nwc.makeInvoice({
  amount: 1000, // 1000 msats
  description: 'Coffee payment',
})

console.log('Invoice:', invoice.invoice)
console.log('Payment hash:', invoice.payment_hash)

nwc.close()
```

## Listen for Payments

```ts
const nwc = new NWC(connectionString)
await nwc.connect()

nwc.on('payment_received', (notification) => {
  console.log('Received payment:', notification.notification.amount, 'msats')
})

// Keep the process running to receive notifications
// Call nwc.close() when you want to stop
```

:::info Notifications require wallet support
Not all wallets support push notifications. Check `info.methods` after connecting to verify your wallet includes `notifications` in its supported methods.
:::

## Next Steps

- [Wallet Operations](/guide/wallet-operations) - detailed guide for every NWC method
- [Error Handling](/guide/error-handling) - catching and handling errors properly
- [API Reference](/api/nwc) - full NWC class reference
