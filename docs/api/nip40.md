# NIP-40

Expiration Timestamp - adds an `expiration` tag to events so relays and clients can discard them after a specified time.

## Import

```ts
import { nip40 } from 'nostr-core'
// or import individual functions
import {
  addExpiration,
  getExpiration,
  isExpired,
} from 'nostr-core'
```

## nip40.addExpiration

```ts
function addExpiration(tags: string[][], expiration: number): string[][]
```

Adds an `expiration` tag (unix timestamp) to event tags. Replaces any existing expiration tag.

```ts
const oneHour = Math.floor(Date.now() / 1000) + 3600
const tags = nip40.addExpiration([], oneHour)
// [['expiration', '1710000000']]
```

## nip40.getExpiration

```ts
function getExpiration(event: NostrEvent | EventTemplate): number | undefined
```

Gets the expiration timestamp from an event, or `undefined` if none.

```ts
const exp = nip40.getExpiration(event)
if (exp) console.log(new Date(exp * 1000))
```

## nip40.isExpired

```ts
function isExpired(event: NostrEvent | EventTemplate, now?: number): boolean
```

Checks if an event has expired. Optionally pass a custom "now" timestamp.

```ts
if (nip40.isExpired(event)) {
  console.log('Event has expired, discard it')
}
```

## How It Works

- The `expiration` tag contains a Unix timestamp after which the event should be considered expired
- Relays MAY discard expired events
- Clients SHOULD hide expired events
- Events without an expiration tag never expire
- The tag can be added to any event kind
- Useful for temporary announcements, ephemeral content, or time-limited offers
