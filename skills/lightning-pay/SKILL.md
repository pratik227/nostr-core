---
name: lightning-pay
description: Execute Lightning payments using nostr-core. Pay BOLT-11 invoices, Lightning Addresses, fiat-denominated payments, and keysend. Includes balance checks, budget verification, and user confirmation patterns. Use when an agent needs to send Bitcoin Lightning payments.
user-invocable: true
argument-hint: "<invoice, Lightning Address, or payment description>"
---

# Lightning Payments with nostr-core

You are helping the user send Lightning payments using **nostr-core**. This skill covers all outbound payment operations.

**Prerequisites:** The user must have nostr-core installed and an NWC connection established. If not, use the `/nwc-integrate` skill first.

## Pre-Payment Checklist

**ALWAYS do these before any payment:**

1. **Check balance:**
   ```typescript
   const { balance } = await nwc.getBalance()
   console.log(`Available: ${Math.floor(balance / 1000)} sats (${balance} msats)`)
   ```

2. **Check budget (NWC spending limits):**
   ```typescript
   const budget = await nwc.getBudget()
   if (budget.total_budget) {
     const remaining = budget.total_budget - (budget.used_budget ?? 0)
     console.log(`Budget remaining: ${Math.floor(remaining / 1000)} sats`)
   }
   ```

3. **Confirm with user before paying:**
   > "I'm about to pay [amount] sats ([description]). Should I proceed?"

**Amount units:**
- All NWC amounts are in **millisatoshis** (1 sat = 1,000 msats)
- `payLightningAddress()` takes **sats** (not msats)
- Always convert for user display: `Math.floor(msats / 1000)` sats

---

## Pay a BOLT-11 Invoice

```typescript
// Invoice with embedded amount
const { preimage, fees_paid } = await nwc.payInvoice('lnbc10u1pj...')
console.log('Paid! Proof:', preimage)
if (fees_paid) console.log('Routing fees:', fees_paid, 'msats')

// Zero-amount invoice - pass amount in msats
const { preimage } = await nwc.payInvoice('lnbc1pj...', 5000)
```

**Returns:** `{ preimage: string, fees_paid?: number }`
- `preimage` is cryptographic proof the payment was completed
- `fees_paid` is Lightning routing fees in msats (may be undefined)

---

## Pay a Lightning Address

Lightning Addresses look like email addresses (e.g., `user@getalby.com`). nostr-core resolves the LNURL and pays in one call.

```typescript
const { preimage, invoice } = await nwc.payLightningAddress('hello@getalby.com', 100)
console.log('Paid 100 sats!')
console.log('Resolved invoice:', invoice)
```

**Parameters:**
- `address` - Lightning Address string (e.g., `user@domain.com`)
- `amountSats` - Amount in **sats** (not msats!)

**Returns:** `{ preimage: string, fees_paid?: number, invoice: string }`

### Standalone utilities (no wallet connection needed):

```typescript
import { validateLightningAddress, parseLightningAddress, fetchInvoice } from 'nostr-core'

// Validate format
const isValid = validateLightningAddress('user@domain.com') // boolean

// Parse parts
const { username, domain } = parseLightningAddress('user@domain.com')

// Fetch invoice without paying
const { invoice, params } = await fetchInvoice('user@domain.com', 100)
```

---

## Pay a Lightning Address in Fiat

Convert fiat currency to sats and pay automatically:

```typescript
const { preimage, sats, rate } = await nwc.payLightningAddressFiat(
  'hello@getalby.com',
  5,      // fiat amount
  'usd'   // currency code
)
console.log(`Paid ${sats} sats ($5 USD at $${rate}/BTC)`)
```

**Returns:** `{ preimage: string, fees_paid?: number, invoice: string, sats: number, rate: number }`

### Standalone fiat utilities:

```typescript
import { getExchangeRate, fiatToSats, satsToFiat } from 'nostr-core'

const rate = await getExchangeRate('usd')       // BTC price in USD
const sats = await fiatToSats(5, 'usd')         // $5 → sats
const fiat = await satsToFiat(10000, 'usd')     // 10000 sats → USD amount
```

Supported currencies: any currency supported by the CoinGecko API (usd, eur, gbp, jpy, etc.).

---

## Keysend Payment

Send directly to a Lightning node by public key (no invoice needed):

```typescript
const { preimage, fees_paid } = await nwc.payKeysend({
  amount: 1000,           // msats
  pubkey: '03abc123...',  // destination node pubkey
})
```

### With TLV records (Podcasting 2.0 / Value4Value):

```typescript
const { preimage } = await nwc.payKeysend({
  amount: 1000,
  pubkey: '03abc123...',
  tlv_records: [
    { type: 7629169, value: 'podcast_guid_here' },
    { type: 7629175, value: JSON.stringify({ podcast: 'My Show', episode: '42' }) },
  ],
})
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | `number` | Yes | Amount in millisatoshis |
| `pubkey` | `string` | Yes | Destination node public key |
| `preimage` | `string` | No | Custom preimage |
| `tlv_records` | `array` | No | TLV records `[{ type, value }]` |

---

## Error Handling for Payments

```typescript
import {
  NWCWalletError,
  NWCReplyTimeoutError,
  LightningAddressError,
  FiatConversionError,
} from 'nostr-core'

try {
  await nwc.payInvoice('lnbc...')
} catch (err) {
  if (err instanceof NWCWalletError) {
    switch (err.code) {
      case 'INSUFFICIENT_BALANCE':
        // Tell user: "Your wallet balance is [X] msats, but the payment requires [Y] msats."
        break
      case 'QUOTA_EXCEEDED':
        // NWC budget limit reached
        break
      case 'PAYMENT_FAILED':
        // No route found or payment rejected by recipient
        break
      default:
        // Other wallet error
    }
  } else if (err instanceof NWCReplyTimeoutError) {
    // Tell user: "Your wallet isn't responding. Please check it's open and connected."
  } else if (err instanceof LightningAddressError) {
    // Invalid Lightning Address or LNURL resolution failed
  } else if (err instanceof FiatConversionError) {
    // Exchange rate API unavailable or unsupported currency
  }
}
```

## User Interaction Prompts

Use these when interacting with the user about payments:

**Confirming a payment:**
> "I'm about to pay an invoice for [amount] msats ([description]). Should I proceed?"

**Insufficient balance:**
> "Your wallet balance is [balance] msats, but the payment requires [amount] msats. Please add funds and try again."

**Wallet not responding:**
> "Your wallet isn't responding. Please check that your wallet app is open and connected to the internet, then let me know to retry."

**Budget exceeded:**
> "Your NWC connection has a spending limit and the remaining budget ([remaining] msats) is less than this payment. Please increase the budget in your wallet's NWC settings."
