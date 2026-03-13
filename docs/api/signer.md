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
  nip44?: {
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

Creates a `Signer` from a raw secret key. Wraps `finalizeEvent()`, `nip04`, and `nip44` internally.

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

// NIP-44 encryption
const encrypted = await signer.nip44.encrypt(recipientPubkey, 'secret')
const decrypted = await signer.nip44.decrypt(senderPubkey, encrypted)
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
const remoteSigner: Signer = new NostrConnect({
  remotePubkey: '<hex-pubkey>',
  relayUrls: ['wss://relay1.example.com', 'wss://relay2.example.com'],
})
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
