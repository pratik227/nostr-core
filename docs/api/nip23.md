# NIP-23

Long-form Content - parameterized replaceable events (kind 30023 for published, kind 30024 for drafts) that store long-form articles with markdown content, titles, images, summaries, and hashtags.

## Import

```ts
import { nip23 } from 'nostr-core'
// or import individual functions
import {
  createLongFormEventTemplate,
  createLongFormEvent,
  parseLongForm,
} from 'nostr-core'
```

## LongFormContent Type

```ts
type LongFormContent = {
  identifier: string
  title?: string
  image?: string
  summary?: string
  publishedAt?: number
  hashtags?: string[]
  content: string
  isDraft?: boolean
}
```

| Field | Type | Description |
|-------|------|-------------|
| `identifier` | `string` | Unique identifier for the article (`d` tag value) |
| `title` | `string` (optional) | Article title |
| `image` | `string` (optional) | Header/cover image URL |
| `summary` | `string` (optional) | Short summary or excerpt |
| `publishedAt` | `number` (optional) | Original publication unix timestamp |
| `hashtags` | `string[]` (optional) | Topic hashtags |
| `content` | `string` | Article body (typically markdown) |
| `isDraft` | `boolean` (optional) | If true, creates kind 30024 (draft) instead of 30023 |

## nip23.createLongFormEventTemplate

```ts
function createLongFormEventTemplate(article: LongFormContent): EventTemplate
```

Creates an unsigned kind 30023 (or 30024 draft) long-form content event template. Use with `finalizeEvent()` or pass to a `Signer`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `article` | `LongFormContent` | Article data including identifier, content, and metadata |

**Returns:** `EventTemplate` - Unsigned kind 30023/30024 event with `d`, `title`, `image`, `summary`, `published_at`, and `t` tags.

```ts
const template = nip23.createLongFormEventTemplate({
  identifier: 'my-first-article',
  title: 'My First Article',
  summary: 'An introduction to Nostr.',
  content: '# My First Article\n\nHello world...',
  hashtags: ['nostr', 'introduction'],
})

const signed = await signer.signEvent(template)
```

## nip23.createLongFormEvent

```ts
function createLongFormEvent(article: LongFormContent, secretKey: Uint8Array): NostrEvent
```

Creates and signs a long-form content event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `article` | `LongFormContent` | Article data |
| `secretKey` | `Uint8Array` | Signer's secret key (32 bytes) |

**Returns:** `NostrEvent` - Signed kind 30023/30024 event ready to publish.

```ts
const event = nip23.createLongFormEvent(
  {
    identifier: 'my-first-article',
    title: 'My First Article',
    image: 'https://example.com/cover.jpg',
    summary: 'An introduction to Nostr.',
    publishedAt: Math.floor(Date.now() / 1000),
    content: '# My First Article\n\nHello world...',
    hashtags: ['nostr', 'introduction'],
  },
  secretKey,
)

await pool.publish(['wss://relay.example.com'], event)
```

## nip23.parseLongForm

```ts
function parseLongForm(event: NostrEvent): LongFormContent
```

Parses a kind 30023 or 30024 long-form content event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NostrEvent` | A kind 30023 or 30024 event |

**Returns:** `LongFormContent` - Parsed article with all metadata.

```ts
const article = nip23.parseLongForm(event)
console.log(article)
// {
//   identifier: 'my-first-article',
//   title: 'My First Article',
//   image: 'https://example.com/cover.jpg',
//   summary: 'An introduction to Nostr.',
//   publishedAt: 1700000000,
//   hashtags: ['nostr', 'introduction'],
//   content: '# My First Article\n\nHello world...',
//   isDraft: false
// }
```

## Full Example

```ts
import { generateSecretKey, getPublicKey, nip23, RelayPool } from 'nostr-core'

const sk = generateSecretKey()
const pk = getPublicKey(sk)
const pool = new RelayPool()

// Create and publish a draft
const draft = nip23.createLongFormEvent(
  {
    identifier: 'nostr-guide',
    title: 'Getting Started with Nostr',
    summary: 'A beginner guide to the Nostr protocol.',
    content: '# Getting Started\n\nNostr is a simple, open protocol...',
    hashtags: ['nostr', 'guide', 'beginners'],
    isDraft: true,
  },
  sk,
)
await pool.publish(['wss://relay.example.com'], draft)

// Later, publish the final version
const published = nip23.createLongFormEvent(
  {
    identifier: 'nostr-guide',
    title: 'Getting Started with Nostr',
    image: 'https://example.com/nostr-cover.jpg',
    summary: 'A beginner guide to the Nostr protocol.',
    publishedAt: Math.floor(Date.now() / 1000),
    content: '# Getting Started\n\nNostr is a simple, open protocol...\n\n## Setting Up\n\n...',
    hashtags: ['nostr', 'guide', 'beginners'],
  },
  sk,
)
await pool.publish(['wss://relay.example.com'], published)

// Fetch and parse long-form articles
const articles = await pool.querySync(
  ['wss://relay.example.com'],
  { kinds: [30023], authors: [pk] },
)

for (const event of articles) {
  const article = nip23.parseLongForm(event)
  console.log(`${article.title} (${article.isDraft ? 'DRAFT' : 'published'})`)
  console.log(`  Tags: ${article.hashtags?.join(', ') ?? 'none'}`)
  console.log(`  ${article.summary}`)
}

pool.close()
```

## How It Works

- **Kind 30023** is a parameterized replaceable event for published articles
- **Kind 30024** is a parameterized replaceable event for drafts
- The `d` tag (identifier) makes the event addressable as `30023:pubkey:identifier`
- Publishing a new event with the same `d` tag replaces the previous version
- The `content` field holds the article body, typically in markdown format
- The `published_at` tag records the original publication date (distinct from `created_at` which updates on edits)
- `t` tags store hashtags for topic-based discovery
- Clients should render the markdown content and display metadata (title, image, summary) in article views
- Drafts (kind 30024) are typically only visible to the author
