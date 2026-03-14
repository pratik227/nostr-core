# NIP-24

Extra Metadata Fields - extends the kind 0 metadata event with additional profile fields (display name, website, banner, bot flag, birthday) and provides utilities for parsing universal tags (`r`, `t`, `title`) that can appear on any event kind.

## Import

```ts
import { nip24 } from 'nostr-core'
// or import individual functions
import {
  parseExtendedMetadata,
  buildMetadataContent,
  parseUniversalTags,
  buildUniversalTags,
} from 'nostr-core'
```

## ExtendedMetadata Type

```ts
type ExtendedMetadata = {
  display_name?: string
  website?: string
  banner?: string
  bot?: boolean
  birthday?: string
  [key: string]: unknown
}
```

| Field | Type | Description |
|-------|------|-------------|
| `display_name` | `string` (optional) | User's display name |
| `website` | `string` (optional) | User's website URL |
| `banner` | `string` (optional) | Banner image URL |
| `bot` | `boolean` (optional) | Whether the account is a bot |
| `birthday` | `string` (optional) | Birthday string (e.g., `'1990-01-15'`) |
| `[key]` | `unknown` | Any additional metadata fields |

## UniversalTags Type

```ts
type UniversalTags = {
  references?: string[]
  hashtags?: string[]
  title?: string
}
```

| Field | Type | Description |
|-------|------|-------------|
| `references` | `string[]` (optional) | URLs or identifiers from `r` tags |
| `hashtags` | `string[]` (optional) | Hashtags from `t` tags |
| `title` | `string` (optional) | Title from `title` tag |

## nip24.parseExtendedMetadata

```ts
function parseExtendedMetadata(event: NostrEvent): ExtendedMetadata
```

Parses extended metadata fields from a kind 0 event's JSON content.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NostrEvent` | A kind 0 metadata event |

**Returns:** `ExtendedMetadata` - Parsed metadata including standard and extra fields. Returns `{}` if content is not valid JSON.

```ts
const metadata = nip24.parseExtendedMetadata(kind0Event)
console.log(metadata)
// {
//   display_name: 'Alice',
//   website: 'https://alice.dev',
//   banner: 'https://example.com/banner.jpg',
//   bot: false,
//   name: 'alice',           // standard NIP-01 field also included
//   about: 'Nostr developer' // standard NIP-01 field also included
// }
```

## nip24.buildMetadataContent

```ts
function buildMetadataContent(metadata: ExtendedMetadata): string
```

Serializes extended metadata into a JSON string suitable for a kind 0 event's content field.

| Parameter | Type | Description |
|-----------|------|-------------|
| `metadata` | `ExtendedMetadata` | Metadata object to serialize |

**Returns:** `string` - JSON string for the event content.

```ts
const content = nip24.buildMetadataContent({
  display_name: 'Alice',
  website: 'https://alice.dev',
  banner: 'https://example.com/banner.jpg',
  bot: false,
})
// Use as the content field of a kind 0 event
```

## nip24.parseUniversalTags

```ts
function parseUniversalTags(event: NostrEvent): UniversalTags
```

Parses universal tags (`r`, `t`, `title`) from any event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NostrEvent` | Any Nostr event |

**Returns:** `UniversalTags` - Parsed references, hashtags, and title.

```ts
const tags = nip24.parseUniversalTags(event)
console.log(tags)
// {
//   references: ['https://example.com/article'],
//   hashtags: ['nostr', 'protocol'],
//   title: 'My Post'
// }
```

## nip24.buildUniversalTags

```ts
function buildUniversalTags(tags: UniversalTags): string[][]
```

Builds universal tag arrays from structured input.

| Parameter | Type | Description |
|-----------|------|-------------|
| `tags` | `UniversalTags` | Tag data to convert |

**Returns:** `string[][]` - Array of `r`, `t`, and `title` tags.

```ts
const tags = nip24.buildUniversalTags({
  references: ['https://example.com'],
  hashtags: ['nostr', 'dev'],
  title: 'My Event',
})
// [
//   ['r', 'https://example.com'],
//   ['t', 'nostr'],
//   ['t', 'dev'],
//   ['title', 'My Event'],
// ]
```

## Full Example

```ts
import { generateSecretKey, finalizeEvent, nip24, RelayPool } from 'nostr-core'

const sk = generateSecretKey()
const pool = new RelayPool()

// Build and publish extended profile metadata
const content = nip24.buildMetadataContent({
  name: 'alice',
  display_name: 'Alice',
  about: 'Nostr developer',
  website: 'https://alice.dev',
  banner: 'https://example.com/banner.jpg',
  picture: 'https://example.com/avatar.jpg',
  bot: false,
  birthday: '1990-05-20',
})

const metadataEvent = finalizeEvent(
  { kind: 0, tags: [], content, created_at: Math.floor(Date.now() / 1000) },
  sk,
)
await pool.publish(['wss://relay.example.com'], metadataEvent)

// Create an event with universal tags
const universalTags = nip24.buildUniversalTags({
  references: ['https://github.com/nostr-protocol/nips'],
  hashtags: ['nostr', 'protocol'],
  title: 'Nostr NIPs Overview',
})

const noteEvent = finalizeEvent(
  {
    kind: 1,
    tags: universalTags,
    content: 'Check out the Nostr NIPs repository!',
    created_at: Math.floor(Date.now() / 1000),
  },
  sk,
)

// Parse extended metadata from a fetched event
const events = await pool.querySync(['wss://relay.example.com'], { kinds: [0], authors: [metadataEvent.pubkey] })
if (events.length > 0) {
  const profile = nip24.parseExtendedMetadata(events[0])
  console.log(`${profile.display_name} - ${profile.website}`)
  if (profile.bot) console.log('This is a bot account')
}

// Parse universal tags from any event
const uTags = nip24.parseUniversalTags(noteEvent)
console.log('References:', uTags.references)
console.log('Hashtags:', uTags.hashtags)

pool.close()
```

## How It Works

- **Extended metadata** adds fields beyond the basic NIP-01 `name`, `about`, `picture` in kind 0 events
- All metadata is stored as JSON in the event `content` field
- The `display_name` field is distinct from `name` - it can contain spaces and special characters
- The `bot` flag indicates automated accounts so clients can label them appropriately
- **Universal tags** (`r`, `t`, `title`) can be attached to any event kind
- `r` tags reference external URLs or identifiers
- `t` tags are hashtags for topic discovery and filtering
- `title` tags give a human-readable title to events
- `parseExtendedMetadata` gracefully handles invalid JSON by returning an empty object
