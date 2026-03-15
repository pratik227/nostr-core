# NIP-30

Custom Emoji - allows events to use custom emoji by referencing shortcodes (`:name:` format) in content and including `emoji` tags that map each shortcode to an image URL.

## Import

```ts
import { nip30 } from 'nostr-core'
// or import individual functions
import {
  parseCustomEmojis,
  buildEmojiTags,
  extractEmojiShortcodes,
} from 'nostr-core'
```

## CustomEmoji Type

```ts
type CustomEmoji = {
  shortcode: string
  url: string
}
```

| Field | Type | Description |
|-------|------|-------------|
| `shortcode` | `string` | Emoji shortcode (without colons), e.g. `'soapbox'` |
| `url` | `string` | URL to the emoji image |

## nip30.parseCustomEmojis

```ts
function parseCustomEmojis(event: NostrEvent): CustomEmoji[]
```

Parses custom emoji tags from an event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NostrEvent` | Any Nostr event with `emoji` tags |

**Returns:** `CustomEmoji[]` - Array of custom emojis found in the event's tags.

```ts
const emojis = nip30.parseCustomEmojis(event)
console.log(emojis)
// [
//   { shortcode: 'soapbox', url: 'https://example.com/soapbox.png' },
//   { shortcode: 'nostrich', url: 'https://example.com/nostrich.gif' },
// ]
```

## nip30.buildEmojiTags

```ts
function buildEmojiTags(emojis: CustomEmoji[]): string[][]
```

Builds `emoji` tags from an array of custom emojis.

| Parameter | Type | Description |
|-----------|------|-------------|
| `emojis` | `CustomEmoji[]` | Custom emojis to convert to tags |

**Returns:** `string[][]` - Array of `['emoji', shortcode, url]` tags.

```ts
const tags = nip30.buildEmojiTags([
  { shortcode: 'soapbox', url: 'https://example.com/soapbox.png' },
  { shortcode: 'nostrich', url: 'https://example.com/nostrich.gif' },
])
// [
//   ['emoji', 'soapbox', 'https://example.com/soapbox.png'],
//   ['emoji', 'nostrich', 'https://example.com/nostrich.gif'],
// ]
```

## nip30.extractEmojiShortcodes

```ts
function extractEmojiShortcodes(content: string): string[]
```

Extracts emoji shortcodes (`:name:` format) from content text. Returns unique shortcodes without the surrounding colons.

| Parameter | Type | Description |
|-----------|------|-------------|
| `content` | `string` | Text content to search for shortcodes |

**Returns:** `string[]` - Array of unique shortcode names (without colons).

```ts
const shortcodes = nip30.extractEmojiShortcodes('Hello :soapbox: world :nostrich: :soapbox:')
console.log(shortcodes) // ['soapbox', 'nostrich']
```

## Full Example

```ts
import { generateSecretKey, finalizeEvent, nip30 } from 'nostr-core'

const sk = generateSecretKey()

// Define available custom emojis
const emojiMap: Record<string, string> = {
  soapbox: 'https://example.com/emojis/soapbox.png',
  nostrich: 'https://example.com/emojis/nostrich.gif',
  zap: 'https://example.com/emojis/zap.webp',
}

// Write a post with custom emojis
const content = 'Love the :nostrich: community! :zap: :zap:'

// Extract which emojis are used in the content
const usedShortcodes = nip30.extractEmojiShortcodes(content)
console.log(usedShortcodes) // ['nostrich', 'zap']

// Build emoji tags for only the emojis that are used
const emojis = usedShortcodes
  .filter(sc => emojiMap[sc])
  .map(sc => ({ shortcode: sc, url: emojiMap[sc] }))

const emojiTags = nip30.buildEmojiTags(emojis)

// Create the event with emoji tags
const event = finalizeEvent(
  {
    kind: 1,
    tags: emojiTags,
    content,
    created_at: Math.floor(Date.now() / 1000),
  },
  sk,
)

// When rendering received events, parse the emoji tags
const parsedEmojis = nip30.parseCustomEmojis(event)
let rendered = event.content
for (const emoji of parsedEmojis) {
  const regex = new RegExp(`:${emoji.shortcode}:`, 'g')
  rendered = rendered.replace(regex, `<img src="${emoji.url}" alt="${emoji.shortcode}" class="emoji" />`)
}
console.log(rendered)
```

## How It Works

- Custom emojis are referenced in content using the `:shortcode:` format (e.g., `:nostrich:`)
- Each emoji must have a corresponding `['emoji', shortcode, url]` tag in the event
- Shortcodes can only contain letters, numbers, and underscores (`[a-zA-Z0-9_]`)
- `extractEmojiShortcodes` returns deduplicated shortcodes from content text
- Clients replace `:shortcode:` in rendered content with the corresponding image from the emoji tags
- Custom emojis work in any event kind, including kind 1 notes, kind 7 reactions, and profiles
- When using a custom emoji as a reaction (kind 7), the content should be `:shortcode:` and the event should include the emoji tag
