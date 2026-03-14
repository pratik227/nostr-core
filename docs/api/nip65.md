# NIP-65

Relay List Metadata - a replaceable event (kind 10002) that advertises a user's preferred relays for reading and writing. Clients use this to discover where to find a user's events and where to send events that mention them.

## Import

```ts
import { nip65 } from 'nostr-core'
// or import individual functions
import {
  parseRelayList,
  createRelayListEventTemplate,
  createRelayListEvent,
  getReadRelays,
  getWriteRelays,
} from 'nostr-core'
```

## RelayReadWrite Type

```ts
type RelayReadWrite = {
  url: string
  read: boolean
  write: boolean
}
```

| Field | Type | Description |
|-------|------|-------------|
| `url` | `string` | Normalized relay WebSocket URL |
| `read` | `boolean` | User reads from this relay |
| `write` | `boolean` | User writes to this relay |

## nip65.parseRelayList

```ts
function parseRelayList(event: NostrEvent): RelayReadWrite[]
```

Parses a kind 10002 relay list event into structured relay entries.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NostrEvent` | A kind 10002 relay list event |

**Returns:** `RelayReadWrite[]` - Array of relay entries with read/write flags.

**Throws:** `Error` if the event is not kind 10002.

```ts
// Fetch a user's relay list from a relay
const events = await pool.querySync(
  ['wss://purplepag.es'],
  { kinds: [10002], authors: [userPubkey] },
)

if (events.length > 0) {
  const relays = nip65.parseRelayList(events[0])
  console.log(relays)
  // [
  //   { url: 'wss://relay.damus.io', read: true, write: true },
  //   { url: 'wss://nos.lol', read: true, write: false },
  //   { url: 'wss://relay.nostr.band', read: false, write: true },
  // ]
}
```

## nip65.createRelayListEventTemplate

```ts
function createRelayListEventTemplate(relays: RelayReadWrite[]): EventTemplate
```

Creates an unsigned kind 10002 event template. Use with `finalizeEvent()` or pass to a `Signer`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `relays` | `RelayReadWrite[]` | Relay entries with read/write flags |

**Returns:** `EventTemplate` - Unsigned kind 10002 event with `r` tags.

```ts
// Create template for use with a Signer
const template = nip65.createRelayListEventTemplate([
  { url: 'wss://relay.damus.io', read: true, write: true },
  { url: 'wss://nos.lol', read: true, write: false },
])

const signed = await signer.signEvent(template)
```

## nip65.createRelayListEvent

```ts
function createRelayListEvent(relays: RelayReadWrite[], secretKey: Uint8Array): NostrEvent
```

Creates and signs a kind 10002 relay list event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `relays` | `RelayReadWrite[]` | Relay entries with read/write flags |
| `secretKey` | `Uint8Array` | Signer's secret key (32 bytes) |

**Returns:** `NostrEvent` - Signed kind 10002 event ready to publish.

```ts
const event = nip65.createRelayListEvent(
  [
    { url: 'wss://relay.damus.io', read: true, write: true },
    { url: 'wss://nos.lol', read: true, write: false },
    { url: 'wss://relay.nostr.band', read: false, write: true },
  ],
  secretKey,
)

// Publish to multiple relays for discoverability
await pool.publish(['wss://purplepag.es', 'wss://relay.damus.io', 'wss://nos.lol'], event)
```

## nip65.getReadRelays

```ts
function getReadRelays(relays: RelayReadWrite[]): string[]
```

Filters a relay list to only read-enabled relay URLs.

```ts
const relays = nip65.parseRelayList(event)
const readRelays = nip65.getReadRelays(relays)
// ['wss://relay.damus.io', 'wss://nos.lol']
```

## nip65.getWriteRelays

```ts
function getWriteRelays(relays: RelayReadWrite[]): string[]
```

Filters a relay list to only write-enabled relay URLs.

```ts
const relays = nip65.parseRelayList(event)
const writeRelays = nip65.getWriteRelays(relays)
// ['wss://relay.damus.io', 'wss://relay.nostr.band']
```

## Full Example

```ts
import { generateSecretKey, getPublicKey, nip65, RelayPool } from 'nostr-core'

const sk = generateSecretKey()
const pk = getPublicKey(sk)
const pool = new RelayPool()

// Publish your relay list
const event = nip65.createRelayListEvent(
  [
    { url: 'wss://relay.damus.io', read: true, write: true },
    { url: 'wss://nos.lol', read: true, write: false },
    { url: 'wss://relay.nostr.band', read: false, write: true },
  ],
  sk,
)
await pool.publish(['wss://purplepag.es', 'wss://relay.damus.io'], event)

// Look up another user's relay list
const events = await pool.querySync(
  ['wss://purplepag.es'],
  { kinds: [10002], authors: [otherUserPubkey] },
)

if (events.length > 0) {
  const relays = nip65.parseRelayList(events[0])
  const writeRelays = nip65.getWriteRelays(relays)
  const readRelays = nip65.getReadRelays(relays)

  // To fetch their events, query their WRITE relays
  const theirEvents = await pool.querySync(writeRelays, { kinds: [1], authors: [otherUserPubkey], limit: 10 })

  // To send them a mention/DM, publish to their READ relays
  await pool.publish(readRelays, myEventMentioningThem)
}

pool.close()
```

## How It Works

- **Kind 10002** is a replaceable event - only the latest version per pubkey is valid
- Each `r` tag contains a relay URL and an optional marker (`read` or `write`)
- No marker means the relay is used for both reading and writing
- **Write relays** are where the user publishes their events - query these to fetch their content
- **Read relays** are where the user reads events - publish mentions/DMs here so the user sees them
- Users should keep relay lists small (2-4 relays per category) for efficiency
- Publish your kind 10002 event to well-known indexer relays (e.g., `wss://purplepag.es`) for discoverability
