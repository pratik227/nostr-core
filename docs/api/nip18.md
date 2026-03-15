# NIP-18

Reposts - kind 6 for reposting kind 1 text notes, and kind 16 for generic reposts of any other event kind. The original event JSON is embedded in the content field.

## Import

```ts
import { nip18 } from 'nostr-core'
// or import individual functions
import {
  createRepostEventTemplate,
  createRepostEvent,
  parseRepost,
} from 'nostr-core'
```

## RepostTarget Type

```ts
type RepostTarget = {
  id: string
  pubkey: string
  relay?: string
  kind?: number
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Event ID of the event being reposted |
| `pubkey` | `string` | Pubkey of the original event author |
| `relay` | `string` (optional) | Relay URL where the original event can be found |
| `kind` | `number` (optional) | Kind of the original event (if not 1, creates a kind 16 generic repost) |

## nip18.createRepostEventTemplate

```ts
function createRepostEventTemplate(target: RepostTarget, originalEvent?: NostrEvent): EventTemplate
```

Creates a repost event template. Kind 6 for text notes (kind 1 or unspecified), kind 16 for other kinds. Optionally embeds the original event JSON in the content.

```ts
// Repost a text note (kind 6)
const template = nip18.createRepostEventTemplate(
  { id: 'event-id', pubkey: 'author-pk' },
  originalEvent,
)

// Generic repost of a long-form article (kind 16)
const generic = nip18.createRepostEventTemplate(
  { id: 'event-id', pubkey: 'author-pk', kind: 30023 },
)
```

## nip18.createRepostEvent

```ts
function createRepostEvent(target: RepostTarget, secretKey: Uint8Array, originalEvent?: NostrEvent): NostrEvent
```

Creates and signs a repost event.

```ts
const repost = nip18.createRepostEvent(
  { id: noteId, pubkey: authorPk, relay: 'wss://relay.example.com' },
  secretKey,
  originalNoteEvent,
)
```

## nip18.parseRepost

```ts
function parseRepost(event: NostrEvent): {
  targetEventId?: string
  targetPubkey?: string
  targetRelay?: string
  targetKind?: number
  embeddedEvent?: NostrEvent
}
```

Parses a kind 6 or kind 16 repost event. Extracts the target info from tags and optionally parses the embedded event from content.

```ts
const repost = nip18.parseRepost(repostEvent)
console.log(repost.targetEventId, repost.targetKind) // 'abc...', 1
if (repost.embeddedEvent) {
  console.log(repost.embeddedEvent.content) // original note content
}
```

## How It Works

- **Kind 6** reposts text notes (kind 1) - the standard "retweet"
- **Kind 16** is a generic repost for any other event kind, with a `k` tag indicating the original kind
- The `e` tag references the event being reposted, with an optional relay hint
- The `p` tag references the original author
- The `content` field contains the full original event JSON (optional but recommended)
- For kind 6, the target kind is implicitly 1 even without a `k` tag
