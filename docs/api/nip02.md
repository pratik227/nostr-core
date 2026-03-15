# NIP-02

Follow List (Contact List) - kind 3 events that store a user's follow list. Each followed pubkey is stored as a `p` tag with optional relay URL and petname.

## Import

```ts
import { nip02 } from 'nostr-core'
// or import individual functions
import {
  createFollowListEventTemplate,
  createFollowListEvent,
  parseFollowList,
  isFollowing,
  getFollowedPubkeys,
} from 'nostr-core'
```

## ContactEntry Type

```ts
type ContactEntry = {
  pubkey: string
  relay?: string
  petname?: string
}
```

| Field | Type | Description |
|-------|------|-------------|
| `pubkey` | `string` | Hex pubkey of the followed user |
| `relay` | `string` (optional) | Recommended relay URL for this contact |
| `petname` | `string` (optional) | Local nickname for the contact |

## nip02.createFollowListEventTemplate

```ts
function createFollowListEventTemplate(contacts: ContactEntry[]): EventTemplate
```

Creates an unsigned kind 3 follow list event template.

```ts
const template = nip02.createFollowListEventTemplate([
  { pubkey: 'abc...', relay: 'wss://relay.example.com', petname: 'alice' },
  { pubkey: 'def...' },
])
```

## nip02.createFollowListEvent

```ts
function createFollowListEvent(contacts: ContactEntry[], secretKey: Uint8Array): NostrEvent
```

Creates and signs a kind 3 follow list event.

```ts
const followList = nip02.createFollowListEvent(
  [{ pubkey: 'abc...', relay: 'wss://relay.example.com' }],
  secretKey,
)
```

## nip02.parseFollowList

```ts
function parseFollowList(event: NostrEvent): ContactEntry[]
```

Parses a kind 3 event into contact entries.

```ts
const contacts = nip02.parseFollowList(event)
// [{ pubkey: 'abc...', relay: 'wss://relay.example.com', petname: 'alice' }]
```

## nip02.isFollowing

```ts
function isFollowing(event: NostrEvent, pubkey: string): boolean
```

Checks if a pubkey is in the follow list.

```ts
const follows = nip02.isFollowing(followListEvent, 'abc...')
```

## nip02.getFollowedPubkeys

```ts
function getFollowedPubkeys(event: NostrEvent): string[]
```

Returns all followed pubkeys from a follow list event.

```ts
const pubkeys = nip02.getFollowedPubkeys(followListEvent)
```

## How It Works

- **Kind 3** is a replaceable event - publishing a new one replaces the previous follow list
- Each `p` tag represents a followed user: `['p', pubkey, relay?, petname?]`
- The `content` field was historically used for relay preferences (deprecated in favor of NIP-65)
- Follow lists are public - anyone can see who you follow
- The relay hint helps clients find events from that user
- Petnames are local nicknames not visible to other users
