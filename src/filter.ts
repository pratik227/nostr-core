import type { NostrEvent } from './event.js'

export type Filter = {
  ids?: string[]
  kinds?: number[]
  authors?: string[]
  since?: number
  until?: number
  limit?: number
  search?: string
  [key: `#${string}`]: string[] | undefined
}

export function matchFilter(filter: Filter, event: NostrEvent): boolean {
  if (filter.ids && filter.ids.indexOf(event.id) === -1) return false
  if (filter.kinds && filter.kinds.indexOf(event.kind) === -1) return false
  if (filter.authors && filter.authors.indexOf(event.pubkey) === -1) return false

  for (const f in filter) {
    if (f[0] === '#') {
      const tagName = f.slice(1)
      const values = filter[`#${tagName}`]
      if (values && !event.tags.find(([t, v]) => t === tagName && values!.indexOf(v) !== -1)) return false
    }
  }

  if (filter.since && event.created_at < filter.since) return false
  if (filter.until && event.created_at > filter.until) return false

  return true
}

export function matchFilters(filters: Filter[], event: NostrEvent): boolean {
  for (let i = 0; i < filters.length; i++) {
    if (matchFilter(filters[i], event)) return true
  }
  return false
}
