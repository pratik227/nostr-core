# NIP-25

Reactions (kind 7) - allows users to react to events with a `+` (like), `-` (dislike), or custom emoji/text content. Reactions reference the target event by its ID and the target author's pubkey.

## Import

```ts
import { nip25 } from 'nostr-core'
// or import individual functions
import {
  createReactionEventTemplate,
  createReactionEvent,
  parseReaction,
} from 'nostr-core'
```

## Reaction Type

```ts
type Reaction = {
  targetEvent?: { id: string; pubkey: string; kind?: number }
  targetAddress?: string
  content: string
}
```

| Field | Type | Description |
|-------|------|-------------|
| `targetEvent` | `{ id: string; pubkey: string; kind?: number }` (optional) | The event being reacted to |
| `targetAddress` | `string` (optional) | Replaceable event address (`kind:pubkey:d-tag`) |
| `content` | `string` | Reaction content: `'+'`, `'-'`, or custom emoji/text |

## nip25.createReactionEventTemplate

```ts
function createReactionEventTemplate(reaction: Reaction): EventTemplate
```

Creates an unsigned kind 7 reaction event template. Use with `finalizeEvent()` or pass to a `Signer`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `reaction` | `Reaction` | Reaction target and content |

**Returns:** `EventTemplate` - Unsigned kind 7 event with `e`, `p`, `k`, and optionally `a` tags.

```ts
const template = nip25.createReactionEventTemplate({
  targetEvent: {
    id: 'target-event-id',
    pubkey: 'target-author-pubkey',
    kind: 1,
  },
  content: '+',
})

const signed = await signer.signEvent(template)
```

## nip25.createReactionEvent

```ts
function createReactionEvent(reaction: Reaction, secretKey: Uint8Array): NostrEvent
```

Creates and signs a kind 7 reaction event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `reaction` | `Reaction` | Reaction target and content |
| `secretKey` | `Uint8Array` | Signer's secret key (32 bytes) |

**Returns:** `NostrEvent` - Signed kind 7 reaction event ready to publish.

```ts
// Like a post
const like = nip25.createReactionEvent(
  {
    targetEvent: { id: 'event-id', pubkey: 'author-pubkey', kind: 1 },
    content: '+',
  },
  secretKey,
)
await pool.publish(['wss://relay.example.com'], like)

// React with custom emoji
const fire = nip25.createReactionEvent(
  {
    targetEvent: { id: 'event-id', pubkey: 'author-pubkey', kind: 1 },
    content: '\u{1F525}',
  },
  secretKey,
)
```

## nip25.parseReaction

```ts
function parseReaction(event: NostrEvent): {
  targetEventId?: string
  targetPubkey?: string
  targetKind?: number
  targetAddress?: string
  content: string
  isPositive: boolean
  isNegative: boolean
  emoji?: string
}
```

Parses a kind 7 reaction event into its components.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NostrEvent` | A kind 7 reaction event |

**Returns:** Object with target references, content, and convenience flags.

| Return Field | Type | Description |
|--------------|------|-------------|
| `targetEventId` | `string` (optional) | ID of the target event |
| `targetPubkey` | `string` (optional) | Pubkey of the target author |
| `targetKind` | `number` (optional) | Kind of the target event |
| `targetAddress` | `string` (optional) | Target replaceable event address |
| `content` | `string` | Reaction content |
| `isPositive` | `boolean` | `true` if content is `'+'` or empty |
| `isNegative` | `boolean` | `true` if content is `'-'` |
| `emoji` | `string` (optional) | The emoji/text if not a simple `+` or `-` |

```ts
const parsed = nip25.parseReaction(reactionEvent)
console.log(parsed)
// {
//   targetEventId: 'event-id',
//   targetPubkey: 'author-pubkey',
//   targetKind: 1,
//   content: '+',
//   isPositive: true,
//   isNegative: false,
//   emoji: undefined
// }
```

## Full Example

```ts
import { generateSecretKey, getPublicKey, nip25, RelayPool } from 'nostr-core'

const sk = generateSecretKey()
const pk = getPublicKey(sk)
const pool = new RelayPool()

// Like a post
const like = nip25.createReactionEvent(
  {
    targetEvent: { id: 'note-id', pubkey: 'note-author', kind: 1 },
    content: '+',
  },
  sk,
)
await pool.publish(['wss://relay.example.com'], like)

// Dislike a post
const dislike = nip25.createReactionEvent(
  {
    targetEvent: { id: 'note-id', pubkey: 'note-author', kind: 1 },
    content: '-',
  },
  sk,
)

// React to a long-form article by address
const articleReaction = nip25.createReactionEvent(
  {
    targetAddress: '30023:author-pubkey:article-slug',
    content: '\u{1F44D}',
  },
  sk,
)

// Fetch and parse reactions on a note
const reactions = await pool.querySync(
  ['wss://relay.example.com'],
  { kinds: [7], '#e': ['note-id'] },
)

let likes = 0
let dislikes = 0
const customReactions: string[] = []

for (const event of reactions) {
  const parsed = nip25.parseReaction(event)
  if (parsed.isPositive) likes++
  else if (parsed.isNegative) dislikes++
  else if (parsed.emoji) customReactions.push(parsed.emoji)
}

console.log(`Likes: ${likes}, Dislikes: ${dislikes}`)
console.log(`Custom reactions: ${customReactions.join(' ')}`)

pool.close()
```

## How It Works

- **Kind 7** events are reactions to other events
- Content `'+'` or empty string means a like/upvote
- Content `'-'` means a dislike/downvote
- Any other content is a custom reaction (emoji or text)
- The `e` tag references the target event ID
- The `p` tag references the target event author's pubkey
- The `k` tag optionally specifies the kind of the target event
- The `a` tag can reference a replaceable event by address instead of (or in addition to) event ID
- Clients typically count reactions per event and display them as like counts or emoji summaries
- A user can have multiple reactions to the same event (e.g., both a like and an emoji)
