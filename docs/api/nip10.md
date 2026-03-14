# NIP-10

Text Note Threads - defines how `e` (event reference) and `p` (pubkey) tags are used in kind 1 text notes to create threaded conversations. Supports both the preferred marker-based format and the deprecated positional format.

## Import

```ts
import { nip10 } from 'nostr-core'
// or import individual functions
import {
  parseThread,
  buildThreadTags,
} from 'nostr-core'
```

## ThreadReference Type

```ts
type ThreadReference = {
  root?: { id: string; relay?: string }
  reply?: { id: string; relay?: string }
  mentions: { id: string; relay?: string }[]
  profiles: string[]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `root` | `{ id: string; relay?: string }` (optional) | The root event of the thread |
| `reply` | `{ id: string; relay?: string }` (optional) | The event being directly replied to |
| `mentions` | `Array<{ id: string; relay?: string }>` | Events mentioned but not replied to |
| `profiles` | `string[]` | Pubkeys of users involved in the thread |

## nip10.parseThread

```ts
function parseThread(event: NostrEvent): ThreadReference
```

Parses thread references from a kind 1 event. Automatically detects and handles both the preferred marker format (`root`, `reply`, `mention` markers in `e` tags) and the deprecated positional format.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NostrEvent` | A kind 1 text note event |

**Returns:** `ThreadReference` - Parsed thread structure with root, reply, mentions, and profiles.

```ts
const thread = nip10.parseThread(replyEvent)
console.log(thread)
// {
//   root: { id: 'root-event-id', relay: 'wss://relay.example.com' },
//   reply: { id: 'parent-event-id', relay: 'wss://relay.example.com' },
//   mentions: [],
//   profiles: ['pubkey1', 'pubkey2']
// }
```

## nip10.buildThreadTags

```ts
function buildThreadTags(opts: {
  root?: { id: string; relay?: string }
  reply?: { id: string; relay?: string }
  mentions?: { id: string; relay?: string }[]
  profiles?: string[]
}): string[][]
```

Builds thread tags using the preferred marker format for a reply event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `opts.root` | `{ id: string; relay?: string }` (optional) | Root event of the thread |
| `opts.reply` | `{ id: string; relay?: string }` (optional) | Event being replied to |
| `opts.mentions` | `Array<{ id: string; relay?: string }>` (optional) | Mentioned events |
| `opts.profiles` | `string[]` (optional) | Pubkeys to tag |

**Returns:** `string[][]` - Array of `e` and `p` tags with proper markers.

```ts
const tags = nip10.buildThreadTags({
  root: { id: 'root-event-id', relay: 'wss://relay.example.com' },
  reply: { id: 'parent-event-id', relay: 'wss://relay.example.com' },
  profiles: ['pubkey-of-parent-author'],
})
// [
//   ['e', 'root-event-id', 'wss://relay.example.com', 'root'],
//   ['e', 'parent-event-id', 'wss://relay.example.com', 'reply'],
//   ['p', 'pubkey-of-parent-author'],
// ]
```

## Full Example

```ts
import { generateSecretKey, getPublicKey, finalizeEvent, nip10, RelayPool } from 'nostr-core'

const sk = generateSecretKey()
const pk = getPublicKey(sk)
const pool = new RelayPool()

// Fetch a thread root
const [rootEvent] = await pool.querySync(
  ['wss://relay.example.com'],
  { ids: ['root-event-id'] },
)

// Build a reply to the root
const replyTags = nip10.buildThreadTags({
  root: { id: rootEvent.id, relay: 'wss://relay.example.com' },
  reply: { id: rootEvent.id, relay: 'wss://relay.example.com' },
  profiles: [rootEvent.pubkey],
})

const reply = finalizeEvent(
  {
    kind: 1,
    tags: replyTags,
    content: 'Great post!',
    created_at: Math.floor(Date.now() / 1000),
  },
  sk,
)
await pool.publish(['wss://relay.example.com'], reply)

// Parse thread references from an event
const thread = nip10.parseThread(reply)
if (thread.root) {
  console.log('Thread root:', thread.root.id)
}
if (thread.reply) {
  console.log('Replying to:', thread.reply.id)
}
console.log('Tagged profiles:', thread.profiles)

pool.close()
```

## How It Works

- **Marker format (preferred):** Each `e` tag has a 4th element marking it as `root`, `reply`, or `mention`
- **Positional format (deprecated):** First `e` tag is the root, last is the reply, middle ones are mentions
- `parseThread` detects which format is used and handles both transparently
- The `root` tag identifies the original event that started the thread
- The `reply` tag identifies the specific event being responded to
- When replying directly to the root, both `root` and `reply` point to the same event
- The optional relay hint (3rd element in `e` tags) helps clients find referenced events
- `p` tags notify users they are mentioned in the thread
