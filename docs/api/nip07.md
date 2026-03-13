# NIP-07

Browser extension signing via `window.nostr`. Wraps NIP-07 compatible extensions (nos2x, Alby, etc.) into the `Signer` interface.

## Nip07Signer

```ts
import { Nip07Signer } from 'nostr-core'

const signer = new Nip07Signer()

const pubkey = await signer.getPublicKey()
const signed = await signer.signEvent({
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [],
  content: 'Hello from extension!',
})
```

### NIP-04 Encryption

```ts
const encrypted = await signer.nip04.encrypt(recipientPubkey, 'secret message')
const decrypted = await signer.nip04.decrypt(senderPubkey, encrypted)
```

### NIP-44 Encryption

```ts
const encrypted = await signer.nip44.encrypt(recipientPubkey, 'secret message')
const decrypted = await signer.nip44.decrypt(senderPubkey, encrypted)
```

### Relay List

```ts
const relays = await signer.getRelays()
// { "wss://relay.damus.io": { read: true, write: true }, ... }
```

## getExtension

Returns `window.nostr` or throws `Nip07NotAvailableError`.

```ts
import { getExtension } from 'nostr-core'

try {
  const ext = getExtension()
  const pubkey = await ext.getPublicKey()
} catch (err) {
  console.error('No NIP-07 extension found')
}
```

## Nip07Extension Interface

TypeScript shape for `window.nostr`:

```ts
interface Nip07Extension {
  getPublicKey(): Promise<string>
  signEvent(event: EventTemplate): Promise<VerifiedEvent>
  nip04?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>
    decrypt(pubkey: string, ciphertext: string): Promise<string>
  }
  nip44?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>
    decrypt(pubkey: string, ciphertext: string): Promise<string>
  }
  getRelays?(): Promise<RelayMap>
}
```

A global `Window` augmentation is included - `window.nostr` is typed automatically when you import from `nostr-core`.

## Errors

| Class | Code | Description |
|-------|------|-------------|
| `Nip07Error` | `NIP07_ERROR` | Base error for NIP-07 operations |
| `Nip07NotAvailableError` | `NIP07_NOT_AVAILABLE` | `window.nostr` is undefined |
