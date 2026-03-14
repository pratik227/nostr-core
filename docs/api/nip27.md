# NIP-27

Text Note References - utilities for extracting and replacing `nostr:` URI mentions embedded in event content text. Uses regex matching to find all `nostr:npub`, `nostr:note`, `nostr:nevent`, `nostr:nprofile`, and `nostr:naddr` references.

## Import

```ts
import { nip27 } from 'nostr-core'
// or import individual functions
import {
  extractReferences,
  replaceReferences,
} from 'nostr-core'
```

## ContentReference Type

```ts
type ContentReference = {
  uri: string
  decoded: DecodedResult
  start: number
  end: number
}
```

| Field | Type | Description |
|-------|------|-------------|
| `uri` | `string` | The full `nostr:` URI string as found in the content |
| `decoded` | `DecodedResult` | NIP-19 decoded result with `type` and `data` |
| `start` | `number` | Start index of the URI in the content string |
| `end` | `number` | End index of the URI in the content string |

## nip27.extractReferences

```ts
function extractReferences(content: string): ContentReference[]
```

Extracts all `nostr:` URI references from content text.

| Parameter | Type | Description |
|-----------|------|-------------|
| `content` | `string` | Text content to search for `nostr:` URIs |

**Returns:** `ContentReference[]` - Array of found references with decoded data and positions. Invalid entities are silently skipped.

```ts
const content = 'Hello nostr:npub1abc123... check out nostr:note1def456...'
const refs = nip27.extractReferences(content)

for (const ref of refs) {
  console.log(`Found ${ref.decoded.type} at position ${ref.start}-${ref.end}`)
  console.log(`URI: ${ref.uri}`)
}
// Found npub at position 6-25
// Found note at position 36-55
```

## nip27.replaceReferences

```ts
function replaceReferences(content: string, replacer: (ref: ContentReference) => string): string
```

Replaces all `nostr:` URI references in content using a custom replacer function. Useful for rendering content with clickable links or display names.

| Parameter | Type | Description |
|-----------|------|-------------|
| `content` | `string` | Text content with `nostr:` URIs |
| `replacer` | `(ref: ContentReference) => string` | Function that returns the replacement string for each reference |

**Returns:** `string` - Content with all `nostr:` URIs replaced.

```ts
const content = 'Thanks nostr:npub1abc123... for the great nostr:note1def456...'

const rendered = nip27.replaceReferences(content, (ref) => {
  switch (ref.decoded.type) {
    case 'npub':
      return `@${ref.decoded.data.slice(0, 8)}...`
    case 'note':
      return `[note]`
    case 'nevent':
      return `[event]`
    case 'nprofile':
      return `@${ref.decoded.data.pubkey.slice(0, 8)}...`
    default:
      return ref.uri
  }
})

console.log(rendered)
// 'Thanks @abc12345... for the great [note]'
```

## Full Example

```ts
import { nip27, nip19, RelayPool } from 'nostr-core'

const pool = new RelayPool()

// Fetch a note
const [event] = await pool.querySync(
  ['wss://relay.example.com'],
  { ids: ['some-event-id'] },
)

// Extract all references from the note content
const refs = nip27.extractReferences(event.content)

console.log(`Found ${refs.length} references:`)
for (const ref of refs) {
  switch (ref.decoded.type) {
    case 'npub':
      console.log(`  Profile: ${ref.decoded.data}`)
      break
    case 'note':
      console.log(`  Note: ${ref.decoded.data}`)
      break
    case 'nevent':
      console.log(`  Event: ${ref.decoded.data.id}`)
      break
    case 'nprofile':
      console.log(`  Profile: ${ref.decoded.data.pubkey}`)
      break
    case 'naddr':
      console.log(`  Address: ${ref.decoded.data.identifier}`)
      break
  }
}

// Render content with display names
const profileNames: Record<string, string> = {
  'abc123...': 'Alice',
  'def456...': 'Bob',
}

const rendered = nip27.replaceReferences(event.content, (ref) => {
  if (ref.decoded.type === 'npub') {
    const name = profileNames[ref.decoded.data]
    return name ? `@${name}` : `@${ref.decoded.data.slice(0, 8)}...`
  }
  if (ref.decoded.type === 'nprofile') {
    const name = profileNames[ref.decoded.data.pubkey]
    return name ? `@${name}` : `@${ref.decoded.data.pubkey.slice(0, 8)}...`
  }
  return ref.uri
})

console.log('Rendered:', rendered)

pool.close()
```

## How It Works

- Content text can contain inline `nostr:` URIs referencing other Nostr entities
- The regex matches `nostr:` followed by any valid NIP-19 bech32 entity prefix and characters
- Supported prefixes: `npub`, `nprofile`, `note`, `nevent`, `naddr`
- `extractReferences` returns position information (`start`, `end`) for precise text manipulation
- `replaceReferences` processes references left-to-right, preserving non-reference text
- Invalid bech32 entities are silently skipped (they won't appear in the results)
- Clients typically use `replaceReferences` to convert raw `nostr:` URIs into clickable links or display names
- This is commonly used when rendering kind 1 text notes and kind 30023 long-form articles
