# NIP-48

Proxy Tags - marks events that were bridged from other protocols (ActivityPub, AT Protocol, RSS, etc.) using a `proxy` tag containing the original ID and protocol name.

## Import

```ts
import { nip48 } from 'nostr-core'
// or import individual functions
import {
  addProxyTag,
  getProxyTags,
  isProxied,
  getProxyByProtocol,
} from 'nostr-core'
```

## ProxyTag Type

```ts
type ProxyProtocol = 'activitypub' | 'atproto' | 'rss' | 'web' | string
type ProxyTag = { id: string; protocol: ProxyProtocol }
```

## nip48.addProxyTag

```ts
function addProxyTag(tags: string[][], id: string, protocol: ProxyProtocol): string[][]
```

Adds a proxy tag to event tags.

```ts
const tags = nip48.addProxyTag([], 'https://mastodon.social/@user/123', 'activitypub')
```

## nip48.getProxyTags

```ts
function getProxyTags(event: NostrEvent | EventTemplate): ProxyTag[]
```

Gets all proxy tags from an event.

```ts
const proxies = nip48.getProxyTags(event)
// [{ id: 'https://mastodon.social/@user/123', protocol: 'activitypub' }]
```

## nip48.isProxied

```ts
function isProxied(event: NostrEvent | EventTemplate): boolean
```

Checks if an event was bridged from another protocol.

## nip48.getProxyByProtocol

```ts
function getProxyByProtocol(event: NostrEvent | EventTemplate, protocol: ProxyProtocol): ProxyTag | undefined
```

Gets the first proxy tag matching a specific protocol.

```ts
const ap = nip48.getProxyByProtocol(event, 'activitypub')
if (ap) console.log(`Bridged from: ${ap.id}`)
```

## How It Works

- The `proxy` tag format is `['proxy', id, protocol]`
- Common protocols: `activitypub`, `atproto`, `rss`, `web`
- The ID is the original identifier in the source protocol (e.g., ActivityPub URL)
- Bridges use this to indicate an event originated outside of Nostr
- Clients can use this to link back to the original source
- An event can have multiple proxy tags if bridged through multiple protocols
