# NIP-31

Dealing with Unknown Event Kinds - provides simple utilities for adding and reading `alt` tags on events. The `alt` tag carries a human-readable description of the event, allowing clients that do not support a particular event kind to display meaningful fallback text.

## Import

```ts
import { nip31 } from 'nostr-core'
// or import individual functions
import {
  addAltTag,
  getAltTag,
} from 'nostr-core'
```

## nip31.addAltTag

```ts
function addAltTag(tags: string[][], description: string): string[][]
```

Adds an `alt` tag to a tag array. If an `alt` tag already exists, it is replaced.

| Parameter | Type | Description |
|-----------|------|-------------|
| `tags` | `string[][]` | Existing tag array |
| `description` | `string` | Human-readable description of the event |

**Returns:** `string[][]` - New tag array with the `alt` tag added (or replaced).

```ts
const tags = [['p', 'pubkey-hex']]
const withAlt = nip31.addAltTag(tags, 'This is a badge definition event')
// [['p', 'pubkey-hex'], ['alt', 'This is a badge definition event']]
```

## nip31.getAltTag

```ts
function getAltTag(event: NostrEvent): string | undefined
```

Extracts the `alt` tag value from an event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NostrEvent` | Any Nostr event |

**Returns:** `string | undefined` - The alt text, or `undefined` if no `alt` tag exists.

```ts
const alt = nip31.getAltTag(event)
if (alt) {
  console.log('Fallback text:', alt)
} else {
  console.log('No alt tag')
}
```

## Full Example

```ts
import { generateSecretKey, finalizeEvent, nip31 } from 'nostr-core'

const sk = generateSecretKey()

// Create a custom event kind with an alt tag for compatibility
let tags: string[][] = [
  ['d', 'my-custom-data'],
  ['status', 'active'],
]

// Add an alt tag so clients that don't know this kind can show something useful
tags = nip31.addAltTag(tags, 'Custom status update: active')

const event = finalizeEvent(
  {
    kind: 30315,
    tags,
    content: '{"status": "active", "expiration": 3600}',
    created_at: Math.floor(Date.now() / 1000),
  },
  sk,
)

// When a client receives an event with an unknown kind
const alt = nip31.getAltTag(event)
if (event.kind === 30315) {
  // Client knows this kind - render normally
  console.log('Status event:', event.content)
} else if (alt) {
  // Client doesn't know this kind - show the fallback text
  console.log(alt)
} else {
  // No alt tag either
  console.log(`Unknown event kind ${event.kind}`)
}

// Replace an existing alt tag
tags = nip31.addAltTag(tags, 'Custom status update: idle')
// The old alt tag is removed and the new one is added
```

## How It Works

- The `alt` tag provides a human-readable summary of an event for clients that don't understand its kind
- Only one `alt` tag should exist per event - `addAltTag` replaces any existing one
- The description should be brief and explain what the event represents
- Clients should display the `alt` text as fallback when encountering an unknown event kind
- This is especially useful for newer NIP kinds that older clients have not implemented
- The `alt` tag does not affect event validation or relay behavior - it is purely for client-side display
