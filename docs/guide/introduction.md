# Introduction

## What is NWC?

**Nostr Wallet Connect (NWC)** is a protocol ([NIP-47](https://github.com/nostr-protocol/nips/blob/master/47.md)) that lets applications interact with Lightning wallets over the Nostr network. Instead of each wallet providing its own proprietary API, NWC defines a standard set of operations - pay invoices, check balances, create invoices - that any wallet can implement.

The communication happens through Nostr relays using encrypted events, so your app never needs direct access to the wallet. The user simply shares a **connection string** and your app can start making requests.

## Why nostr-core?

Existing NWC libraries tend to be either:

- **Vendor-specific** - tightly coupled to one wallet provider's SDK
- **Heavy** - pulling in large Nostr client frameworks when you only need wallet operations
- **Incomplete** - missing encryption support, error handling, or TypeScript types

**nostr-core** takes a different approach:

- **Single connection string** - pass in a `nostr+walletconnect://` URI and start making calls
- **Full NIP-47 coverage** - every method (`pay_invoice`, `get_balance`, `make_invoice`, `list_transactions`, etc.)
- **Auto-encryption** - detects whether the wallet supports NIP-04 or NIP-44 and handles it transparently
- **Typed errors** - specific error classes for timeouts, connection failures, wallet errors, and decryption issues
- **Zero framework deps** - built on audited [noble](https://paulmillr.com/noble/) cryptography libraries only
- **ESM-only** - tree-shakeable, modern JavaScript

## What's Included

Beyond the NWC client, nostr-core also exports the low-level building blocks:

| Module | Description |
|--------|-------------|
| `NWC` | High-level wallet client |
| `Relay` / `RelayPool` | WebSocket relay connections |
| `nip04` | AES-256-CBC encryption |
| `nip44` | ChaCha20 encryption |
| `nip19` | Bech32 encoding/decoding |
| `finalizeEvent` / `verifyEvent` | Event signing and verification |
| `generateSecretKey` / `getPublicKey` | Key generation |
| `Filter` / `matchFilter` | Event filtering |

These are the same primitives used internally by the NWC client, exposed so you can build custom Nostr applications without pulling in another library.

## Coming from @getalby/sdk?

If you've been using the Alby JS SDK, nostr-core gives you the same NWC protocol coverage with fewer dependencies, no vendor lock-in, typed errors, and cross-runtime support. See the [comparison guide](./comparison.md) for a detailed breakdown.
