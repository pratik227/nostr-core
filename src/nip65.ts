import { finalizeEvent, type NostrEvent, type EventTemplate } from './event.js'
import { normalizeURL } from './utils.js'

// Kind constant
const RELAY_LIST_KIND = 10002

// Types

export type RelayReadWrite = {
  url: string
  read: boolean
  write: boolean
}

// Public API

/**
 * Parse a kind 10002 relay list event into structured relay entries.
 */
export function parseRelayList(event: NostrEvent): RelayReadWrite[] {
  if (event.kind !== RELAY_LIST_KIND) {
    throw new Error(`Expected kind ${RELAY_LIST_KIND} relay list event, got kind ${event.kind}`)
  }

  const relays: RelayReadWrite[] = []
  const seen = new Set<string>()

  for (const tag of event.tags) {
    if (tag[0] !== 'r') continue

    const url = normalizeURL(tag[1])
    if (seen.has(url)) continue
    seen.add(url)

    const marker = tag[2]

    if (marker === 'read') {
      relays.push({ url, read: true, write: false })
    } else if (marker === 'write') {
      relays.push({ url, read: false, write: true })
    } else {
      // No marker = bidirectional
      relays.push({ url, read: true, write: true })
    }
  }

  return relays
}

/**
 * Create a kind 10002 relay list event template (unsigned).
 * Sign with `finalizeEvent()` or pass to a Signer.
 */
export function createRelayListEventTemplate(relays: RelayReadWrite[]): EventTemplate {
  const tags: string[][] = []
  const seen = new Set<string>()

  for (const relay of relays) {
    const url = normalizeURL(relay.url)
    if (seen.has(url)) continue
    seen.add(url)

    if (relay.read && relay.write) {
      tags.push(['r', url])
    } else if (relay.read) {
      tags.push(['r', url, 'read'])
    } else if (relay.write) {
      tags.push(['r', url, 'write'])
    }
  }

  return {
    kind: RELAY_LIST_KIND,
    tags,
    content: '',
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create and sign a kind 10002 relay list event.
 */
export function createRelayListEvent(relays: RelayReadWrite[], secretKey: Uint8Array): NostrEvent {
  return finalizeEvent(createRelayListEventTemplate(relays), secretKey)
}

/**
 * Get only read relays from a parsed relay list.
 */
export function getReadRelays(relays: RelayReadWrite[]): string[] {
  return relays.filter(r => r.read).map(r => r.url)
}

/**
 * Get only write relays from a parsed relay list.
 */
export function getWriteRelays(relays: RelayReadWrite[]): string[] {
  return relays.filter(r => r.write).map(r => r.url)
}
