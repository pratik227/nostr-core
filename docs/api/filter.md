# Filter

Types and functions for filtering Nostr events.

## Import

```ts
import { matchFilter, matchFilters } from 'nostr-core'
```

## Filter Type

```ts
type Filter = {
  ids?: string[]
  kinds?: number[]
  authors?: string[]
  since?: number
  until?: number
  limit?: number
  search?: string
  [key: `#${string}`]: string[] | undefined
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ids` | `string[]?` | Match event IDs |
| `kinds` | `number[]?` | Match event kinds |
| `authors` | `string[]?` | Match author pubkeys |
| `since` | `number?` | Events created after this timestamp |
| `until` | `number?` | Events created before this timestamp |
| `limit` | `number?` | Max events to return |
| `search` | `string?` | Full-text search query |
| `#<tag>` | `string[]?` | Match tag values (e.g. `#e`, `#p`) |

### Tag Filters

Filter by tag values using the `#` prefix:

```ts
const filter: Filter = {
  kinds: [1],
  '#e': ['event_id_1', 'event_id_2'], // Events referencing these event IDs
  '#p': ['pubkey_1'],                  // Events mentioning this pubkey
}
```

## matchFilter

```ts
function matchFilter(filter: Filter, event: NostrEvent): boolean
```

Tests whether an event matches a single filter. All specified conditions must match (logical AND).

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter` | `Filter` | Filter to test against |
| `event` | `NostrEvent` | Event to test |

**Returns:** `boolean`

```ts
const filter = { kinds: [1], authors: ['abc...'] }

if (matchFilter(filter, event)) {
  console.log('Event matches')
}
```

## matchFilters

```ts
function matchFilters(filters: Filter[], event: NostrEvent): boolean
```

Tests whether an event matches **any** filter in the array (logical OR).

| Parameter | Type | Description |
|-----------|------|-------------|
| `filters` | `Filter[]` | Filters to test against |
| `event` | `NostrEvent` | Event to test |

**Returns:** `boolean`

```ts
const filters = [
  { kinds: [1] },
  { kinds: [6], '#e': ['some_id'] },
]

if (matchFilters(filters, event)) {
  console.log('Event matches at least one filter')
}
```
