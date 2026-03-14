# NIP-09

Event Deletion - creates kind 5 deletion request events that signal to relays and clients that specific events or replaceable event addresses should be removed. Only the original author of an event can request its deletion.

## Import

```ts
import { nip09 } from 'nostr-core'
// or import individual functions
import {
  createDeletionEventTemplate,
  createDeletionEvent,
  parseDeletion,
  isDeletionOf,
} from 'nostr-core'
```

## DeletionTarget Type

```ts
type DeletionTarget =
  | { type: 'event'; id: string }
  | { type: 'address'; address: string }
```

| Variant | Field | Type | Description |
|---------|-------|------|-------------|
| `'event'` | `id` | `string` | Event ID (hex) to delete |
| `'address'` | `address` | `string` | Replaceable event address in `kind:pubkey:d-tag` format |

## DeletionRequest Type

```ts
type DeletionRequest = {
  targets: DeletionTarget[]
  reason?: string
}
```

| Field | Type | Description |
|-------|------|-------------|
| `targets` | `DeletionTarget[]` | Events or addresses to delete |
| `reason` | `string` (optional) | Human-readable reason for deletion (stored in content) |

## nip09.createDeletionEventTemplate

```ts
function createDeletionEventTemplate(request: DeletionRequest): EventTemplate
```

Creates an unsigned kind 5 deletion event template. Use with `finalizeEvent()` or pass to a `Signer`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `request` | `DeletionRequest` | Deletion targets and optional reason |

**Returns:** `EventTemplate` - Unsigned kind 5 event with `e`, `a`, and `k` tags.

```ts
const template = nip09.createDeletionEventTemplate({
  targets: [
    { type: 'event', id: 'abc123...' },
  ],
  reason: 'Posted by mistake',
})

const signed = await signer.signEvent(template)
```

## nip09.createDeletionEvent

```ts
function createDeletionEvent(request: DeletionRequest, secretKey: Uint8Array): NostrEvent
```

Creates and signs a kind 5 deletion event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `request` | `DeletionRequest` | Deletion targets and optional reason |
| `secretKey` | `Uint8Array` | Signer's secret key (32 bytes) |

**Returns:** `NostrEvent` - Signed kind 5 deletion event ready to publish.

```ts
const deletion = nip09.createDeletionEvent(
  {
    targets: [
      { type: 'event', id: 'abc123...' },
      { type: 'address', address: '30023:pubkey123:my-article' },
    ],
    reason: 'Removing outdated content',
  },
  secretKey,
)

await pool.publish(['wss://relay.example.com'], deletion)
```

## nip09.parseDeletion

```ts
function parseDeletion(event: NostrEvent): {
  eventIds: string[]
  addresses: string[]
  kinds: number[]
  reason: string
}
```

Parses a kind 5 deletion event into its components.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NostrEvent` | A kind 5 deletion event |

**Returns:** Object containing `eventIds`, `addresses`, `kinds`, and `reason`.

```ts
const parsed = nip09.parseDeletion(deletionEvent)
console.log(parsed)
// {
//   eventIds: ['abc123...'],
//   addresses: ['30023:pubkey123:my-article'],
//   kinds: [30023],
//   reason: 'Removing outdated content'
// }
```

## nip09.isDeletionOf

```ts
function isDeletionOf(deletion: NostrEvent, target: NostrEvent): boolean
```

Checks whether a deletion event targets a specific event. Verifies that the deletion is kind 5, authored by the same pubkey, and references the target event ID.

| Parameter | Type | Description |
|-----------|------|-------------|
| `deletion` | `NostrEvent` | A kind 5 deletion event |
| `target` | `NostrEvent` | The event to check against |

**Returns:** `boolean` - `true` if the deletion targets the given event.

```ts
if (nip09.isDeletionOf(deletionEvent, originalEvent)) {
  console.log('This event has been deleted by its author')
}
```

## Full Example

```ts
import { generateSecretKey, getPublicKey, finalizeEvent, nip09, RelayPool } from 'nostr-core'

const sk = generateSecretKey()
const pk = getPublicKey(sk)
const pool = new RelayPool()

// Publish an event
const event = finalizeEvent(
  { kind: 1, tags: [], content: 'Oops, typo!', created_at: Math.floor(Date.now() / 1000) },
  sk,
)
await pool.publish(['wss://relay.example.com'], event)

// Delete it
const deletion = nip09.createDeletionEvent(
  {
    targets: [{ type: 'event', id: event.id }],
    reason: 'Correcting a typo',
  },
  sk,
)
await pool.publish(['wss://relay.example.com'], deletion)

// When processing events, check for deletions
const events = await pool.querySync(['wss://relay.example.com'], { kinds: [5], authors: [pk] })
for (const del of events) {
  const parsed = nip09.parseDeletion(del)
  console.log(`Deleted ${parsed.eventIds.length} events: ${parsed.reason}`)
}

pool.close()
```

## How It Works

- **Kind 5** events are deletion requests, not guarantees - relays may or may not honor them
- Each `e` tag references a specific event ID to delete
- Each `a` tag references a replaceable event address (`kind:pubkey:d-tag`) to delete
- `k` tags indicate the kinds of addressed events for relay filtering
- The `content` field contains an optional human-readable reason
- Only deletions authored by the same pubkey as the target event are valid
- Clients should hide events that have a valid deletion request from the same author
- Relays that support NIP-09 will stop serving deleted events
