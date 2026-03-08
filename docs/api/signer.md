# Signer

A common interface for Nostr event signing. Unifies secret-key signing, browser extension signing (NIP-07), and remote signing (NIP-46) behind a single API.

## Signer Interface

```ts
interface Signer {
  getPublicKey(): Promise<string>
  signEvent(event: EventTemplate): Promise<VerifiedEvent>
  nip04?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>
    decrypt(pubkey: string, ciphertext: string): Promise<string>
  }
  getRelays?(): Promise<RelayMap>
}
```

## RelayMap Type

```ts
type RelayMap = Record<string, { read: boolean; write: boolean }>
```

## createSecretKeySigner

Creates a `Signer` from a raw secret key. Wraps `finalizeEvent()` and `nip04` internally.

```ts
import { generateSecretKey, createSecretKeySigner } from 'nostr-core'

const sk = generateSecretKey()
const signer = createSecretKeySigner(sk)

const pubkey = await signer.getPublicKey()
const signed = await signer.signEvent({
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [],
  content: 'Hello Nostr!',
})
```

## Usage with Different Backends

```ts
import { createSecretKeySigner, Nip07Signer, NostrConnect } from 'nostr-core'
import type { Signer } from 'nostr-core'

// Secret key signer
const skSigner: Signer = createSecretKeySigner(secretKey)

// Browser extension signer (NIP-07)
const extSigner: Signer = new Nip07Signer()

// Remote signer (NIP-46)
const remoteSigner: Signer = new NostrConnect('nostrconnect://...')
await remoteSigner.connect()

// All three work the same way
async function publishNote(signer: Signer, text: string) {
  const pubkey = await signer.getPublicKey()
  const event = await signer.signEvent({
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: text,
  })
  // publish event...
}
```
