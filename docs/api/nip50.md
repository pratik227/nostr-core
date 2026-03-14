# NIP-50

Search - extends the Nostr filter with a `search` field for full-text search on relays that support it. Includes query modifier parsing for advanced search features.

## Import

```ts
import { nip50 } from 'nostr-core'
// or import individual functions
import {
  buildSearchFilter,
  parseSearchQuery,
  buildSearchQuery,
} from 'nostr-core'
```

## SearchFilter Type

```ts
type SearchFilter = Filter & {
  search?: string
}
```

## nip50.buildSearchFilter

```ts
function buildSearchFilter(query: string, filter?: Filter): SearchFilter
```

Builds a search filter by adding the `search` field to a standard Nostr filter.

```ts
const filter = nip50.buildSearchFilter('bitcoin lightning')
// { search: 'bitcoin lightning' }

const filtered = nip50.buildSearchFilter('nostr protocol', { kinds: [1], limit: 20 })
// { kinds: [1], limit: 20, search: 'nostr protocol' }
```

## nip50.parseSearchQuery

```ts
function parseSearchQuery(query: string): { text: string; modifiers: Record<string, string> }
```

Parses search modifiers (key:value) from a query string.

```ts
const parsed = nip50.parseSearchQuery('bitcoin include:spam language:en')
// { text: 'bitcoin', modifiers: { include: 'spam', language: 'en' } }
```

## nip50.buildSearchQuery

```ts
function buildSearchQuery(text: string, modifiers?: Record<string, string>): string
```

Builds a search query string from text and modifiers.

```ts
const query = nip50.buildSearchQuery('bitcoin', { language: 'en', domain: 'example.com' })
// 'bitcoin language:en domain:example.com'
```

## How It Works

- The `search` field is added to REQ filters: `["REQ", sub_id, { search: "query", ... }]`
- Only relays that advertise NIP-50 support will handle search filters
- Search modifiers use `key:value` format within the search string
- Common modifiers: `include:spam`, `domain:`, `language:`, `sentiment:`, `nsfw:`
- The search query is combined with standard filter fields (kinds, authors, etc.)
- Results are returned as standard Nostr events
