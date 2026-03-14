# NIP-51

Lists - replaceable and parameterized replaceable events (kinds 10000-10102, 30000+) for curating collections of pubkeys, event IDs, relay URLs, hashtags, and addresses. Lists support both public items (in tags) and private items (NIP-44 encrypted in content).

## Import

```ts
import { nip51 } from 'nostr-core'
// or import individual functions
import {
  createListEventTemplate,
  createListEvent,
  parseList,
  getEventIds,
  getPubkeys,
  getHashtags,
  getRelayUrls,
  getAddresses,
} from 'nostr-core'
```

## ListItem Type

```ts
type ListItem = {
  tag: string
  value: string
  extra?: string[]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `tag` | `string` | Tag name (e.g., `'p'`, `'e'`, `'t'`, `'relay'`, `'a'`) |
| `value` | `string` | Tag value (pubkey, event ID, hashtag, URL, or address) |
| `extra` | `string[]` (optional) | Additional tag elements (e.g., relay hint, petname) |

## ParsedList Type

```ts
type ParsedList = {
  kind: number
  identifier?: string
  publicItems: ListItem[]
  privateItems: ListItem[]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `kind` | `number` | Event kind |
| `identifier` | `string` (optional) | `d` tag value for parameterized replaceable lists |
| `publicItems` | `ListItem[]` | Items visible to everyone (from tags) |
| `privateItems` | `ListItem[]` | Items only visible to the list owner (decrypted from content) |

## nip51.createListEventTemplate

```ts
function createListEventTemplate(opts: {
  kind: number
  identifier?: string
  publicItems: ListItem[]
  privateItems?: ListItem[]
  secretKey?: Uint8Array
}): EventTemplate
```

Creates an unsigned list event template. If `privateItems` and `secretKey` are provided, private items are NIP-44 self-encrypted into the content field.

| Parameter | Type | Description |
|-----------|------|-------------|
| `opts.kind` | `number` | List event kind (e.g., 10000, 10001, 30000) |
| `opts.identifier` | `string` (optional) | `d` tag for parameterized replaceable events |
| `opts.publicItems` | `ListItem[]` | Public list items |
| `opts.privateItems` | `ListItem[]` (optional) | Private list items (encrypted in content) |
| `opts.secretKey` | `Uint8Array` (optional) | Required for encrypting private items |

**Returns:** `EventTemplate` - Unsigned list event with public items as tags and optional encrypted content.

```ts
const template = nip51.createListEventTemplate({
  kind: 10000,
  publicItems: [
    { tag: 'p', value: 'pubkey-to-mute' },
  ],
  privateItems: [
    { tag: 'p', value: 'secretly-muted-pubkey' },
  ],
  secretKey: sk,
})
```

## nip51.createListEvent

```ts
function createListEvent(
  opts: {
    kind: number
    identifier?: string
    publicItems: ListItem[]
    privateItems?: ListItem[]
  },
  secretKey: Uint8Array,
): NostrEvent
```

Creates and signs a list event. Private items are automatically encrypted.

| Parameter | Type | Description |
|-----------|------|-------------|
| `opts` | `object` | List configuration (same as template minus secretKey) |
| `secretKey` | `Uint8Array` | Signer's secret key (32 bytes) |

**Returns:** `NostrEvent` - Signed list event ready to publish.

```ts
const muteList = nip51.createListEvent(
  {
    kind: 10000,
    publicItems: [
      { tag: 'p', value: 'spammer-pubkey' },
    ],
    privateItems: [
      { tag: 'p', value: 'privately-muted-pubkey' },
    ],
  },
  secretKey,
)

await pool.publish(['wss://relay.example.com'], muteList)
```

## nip51.parseList

```ts
function parseList(event: NostrEvent, secretKey?: Uint8Array): ParsedList
```

Parses a list event. If `secretKey` is provided, attempts to decrypt private items from the content.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NostrEvent` | A list event |
| `secretKey` | `Uint8Array` (optional) | Secret key for decrypting private items |

**Returns:** `ParsedList` - Parsed list with public and private items.

```ts
// Parse without decryption (public items only)
const publicOnly = nip51.parseList(listEvent)
console.log(publicOnly.publicItems)

// Parse with decryption (all items)
const full = nip51.parseList(listEvent, secretKey)
console.log(full.publicItems)
console.log(full.privateItems)
```

## nip51.getEventIds

```ts
function getEventIds(list: ParsedList): string[]
```

Extracts all event IDs (`e` tag items) from a parsed list.

```ts
const eventIds = nip51.getEventIds(parsedList)
// ['event-id-1', 'event-id-2']
```

## nip51.getPubkeys

```ts
function getPubkeys(list: ParsedList): string[]
```

Extracts all pubkeys (`p` tag items) from a parsed list.

```ts
const pubkeys = nip51.getPubkeys(parsedList)
// ['pubkey-1', 'pubkey-2']
```

## nip51.getHashtags

```ts
function getHashtags(list: ParsedList): string[]
```

Extracts all hashtags (`t` tag items) from a parsed list.

```ts
const hashtags = nip51.getHashtags(parsedList)
// ['nostr', 'bitcoin']
```

## nip51.getRelayUrls

```ts
function getRelayUrls(list: ParsedList): string[]
```

Extracts all relay URLs (`relay` tag items) from a parsed list.

```ts
const relays = nip51.getRelayUrls(parsedList)
// ['wss://relay.example.com', 'wss://relay2.example.com']
```

## nip51.getAddresses

```ts
function getAddresses(list: ParsedList): string[]
```

Extracts all parameterized replaceable event addresses (`a` tag items) from a parsed list.

```ts
const addresses = nip51.getAddresses(parsedList)
// ['30023:pubkey:article-slug']
```

## Full Example

```ts
import { generateSecretKey, getPublicKey, nip51, RelayPool } from 'nostr-core'

const sk = generateSecretKey()
const pk = getPublicKey(sk)
const pool = new RelayPool()

// Create a mute list (kind 10000)
const muteList = nip51.createListEvent(
  {
    kind: 10000,
    publicItems: [
      { tag: 'p', value: 'spammer-pubkey-1' },
      { tag: 't', value: 'spam' },
    ],
    privateItems: [
      { tag: 'p', value: 'annoying-person-pubkey' },
    ],
  },
  sk,
)
await pool.publish(['wss://relay.example.com'], muteList)

// Create a bookmark list (kind 10003)
const bookmarks = nip51.createListEvent(
  {
    kind: 10003,
    publicItems: [
      { tag: 'e', value: 'favorite-event-id' },
      { tag: 'a', value: '30023:author:great-article' },
    ],
  },
  sk,
)
await pool.publish(['wss://relay.example.com'], bookmarks)

// Create a custom named list (kind 30000)
const readingList = nip51.createListEvent(
  {
    kind: 30000,
    identifier: 'reading-list',
    publicItems: [
      { tag: 'a', value: '30023:author1:article-1' },
      { tag: 'a', value: '30023:author2:article-2' },
    ],
  },
  sk,
)
await pool.publish(['wss://relay.example.com'], readingList)

// Fetch and parse a user's mute list
const events = await pool.querySync(
  ['wss://relay.example.com'],
  { kinds: [10000], authors: [pk] },
)

if (events.length > 0) {
  const parsed = nip51.parseList(events[0], sk)
  const mutedPubkeys = nip51.getPubkeys(parsed)
  const mutedHashtags = nip51.getHashtags(parsed)

  console.log(`Muted ${mutedPubkeys.length} users`)
  console.log(`Muted ${mutedHashtags.length} hashtags`)
  console.log(`Private items: ${parsed.privateItems.length}`)
}

pool.close()
```

## How It Works

- **Kind 10000** = Mute list, **10001** = Pin list, **10003** = Bookmark list, **10002** = Relay list
- **Kind 30000** = Named people list, **30001** = Named bookmark list (parameterized replaceable)
- Public items are stored as regular event tags and are visible to everyone
- Private items are NIP-44 self-encrypted (encrypted to your own pubkey) and stored in the event content
- Only the list owner can decrypt private items using their secret key
- `parseList` silently returns empty `privateItems` if decryption fails or no key is provided
- Replaceable events (kinds 10000-10102) are replaced by publishing a new event of the same kind
- Parameterized replaceable events (kinds 30000+) use the `d` tag as the unique identifier
- Helper functions (`getEventIds`, `getPubkeys`, etc.) combine both public and private items
