import type { Filter } from './filter.js'

export type SearchFilter = Filter & {
  search?: string
}

/**
 * Build a search filter for use with relays that support NIP-50.
 * Adds the `search` field to a standard Nostr filter.
 */
export function buildSearchFilter(query: string, filter?: Filter): SearchFilter {
  return {
    ...filter,
    search: query,
  }
}

/**
 * Parse search modifiers from a search query string.
 * Extracts key:value pairs and returns them with the remaining plain text.
 * Modifiers: include:spam, domain:example.com, language:en, sentiment:positive, etc.
 */
export function parseSearchQuery(query: string): {
  text: string
  modifiers: Record<string, string>
} {
  const modifiers: Record<string, string> = {}
  const parts: string[] = []

  for (const token of query.split(/\s+/)) {
    const colonIdx = token.indexOf(':')
    if (colonIdx > 0 && colonIdx < token.length - 1) {
      const key = token.slice(0, colonIdx)
      const value = token.slice(colonIdx + 1)
      modifiers[key] = value
    } else {
      parts.push(token)
    }
  }

  return {
    text: parts.join(' '),
    modifiers,
  }
}

/**
 * Build a search query string from text and modifiers.
 */
export function buildSearchQuery(text: string, modifiers?: Record<string, string>): string {
  const parts = [text]
  if (modifiers) {
    for (const [key, value] of Object.entries(modifiers)) {
      parts.push(`${key}:${value}`)
    }
  }
  return parts.filter(Boolean).join(' ')
}
