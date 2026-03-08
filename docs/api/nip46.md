# NIP-46

Nostr Connect - remote signing over relays. Delegates signing to a remote signer (e.g. nsecBunker) via NIP-04 encrypted kind `24133` events.

## NostrConnect

### Constructor

Accepts a `nostrconnect://` URI string or a `Nip46ConnectionOptions` object:

```ts
import { NostrConnect } from 'nostr-core'

// From URI
const signer = new NostrConnect('nostrconnect://<remote-pubkey>?relay=wss://relay.example.com')

// From options
const signer = new NostrConnect({
  remotePubkey: '<hex-pubkey>',
  relayUrl: 'wss://relay.example.com',
  secretKey: mySecretKey, // optional - random key generated if omitted
})
```

### Connection

```ts
await signer.connect()     // Connect to relay + NIP-46 handshake
await signer.disconnect()  // Send disconnect RPC + close relay
signer.close()             // Immediate cleanup (no disconnect RPC)
```

### Signer Methods

```ts
const pubkey = await signer.getPublicKey()

const signed = await signer.signEvent({
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [],
  content: 'Hello via remote signer!',
})
```

### NIP-04 Encryption

```ts
const encrypted = await signer.nip04.encrypt(recipientPubkey, 'secret message')
const decrypted = await signer.nip04.decrypt(senderPubkey, encrypted)
```

### Other Methods

```ts
const methods = await signer.describe()  // ['connect', 'sign_event', ...]
const relays = await signer.getRelays()  // RelayMap
```

### Configuration

```ts
signer.timeout = 30000  // RPC timeout in ms (default: 60s)
```

## parseConnectionURI

Parses a `nostrconnect://` URI into its components:

```ts
import { parseConnectionURI } from 'nostr-core'

const { remotePubkey, relayUrl } = parseConnectionURI('nostrconnect://<pubkey>?relay=wss://...')
```

## Nip46ConnectionOptions

```ts
type Nip46ConnectionOptions = {
  remotePubkey: string
  relayUrl: string
  secretKey?: Uint8Array
}
```

## Nip46Method

```ts
type Nip46Method =
  | 'connect'
  | 'disconnect'
  | 'describe'
  | 'get_public_key'
  | 'sign_event'
  | 'nip04_encrypt'
  | 'nip04_decrypt'
  | 'get_relays'
```

## Errors

| Class | Code | Description |
|-------|------|-------------|
| `Nip46Error` | `NIP46_ERROR` | Base error for NIP-46 operations |
| `Nip46TimeoutError` | `NIP46_TIMEOUT` | RPC request timed out |
| `Nip46ConnectionError` | `NIP46_CONNECTION_ERROR` | Failed to connect to relay or handshake failed |
| `Nip46RemoteError` | `NIP46_REMOTE_ERROR` | Remote signer returned an error |
