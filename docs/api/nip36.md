# NIP-36

Sensitive Content / Content Warning - adds a `content-warning` tag to events to flag sensitive content. Clients can use this to hide content behind a warning before showing it.

## Import

```ts
import { nip36 } from 'nostr-core'
// or import individual functions
import {
  addContentWarning,
  getContentWarning,
  hasContentWarning,
} from 'nostr-core'
```

## nip36.addContentWarning

```ts
function addContentWarning(tags: string[][], reason?: string): string[][]
```

Adds a `content-warning` tag to event tags. Replaces any existing content-warning tag.

```ts
const tags = nip36.addContentWarning([], 'spoiler for movie')
// [['content-warning', 'spoiler for movie']]

const noReason = nip36.addContentWarning([], )
// [['content-warning']]
```

## nip36.getContentWarning

```ts
function getContentWarning(event: NostrEvent | EventTemplate): string | undefined
```

Gets the content-warning reason from an event, or `undefined` if no content-warning tag exists.

```ts
const reason = nip36.getContentWarning(event) // 'spoiler for movie'
```

## nip36.hasContentWarning

```ts
function hasContentWarning(event: NostrEvent | EventTemplate): boolean
```

Checks if an event has a content-warning tag.

```ts
if (nip36.hasContentWarning(event)) {
  showWarningOverlay(nip36.getContentWarning(event))
}
```

## How It Works

- The `content-warning` tag flags an event as containing sensitive content
- An optional reason string describes why the content is flagged
- Clients should hide the content behind a click-through warning
- Common reasons: NSFW, spoilers, violence, controversial topics
- The tag can be added to any event kind
