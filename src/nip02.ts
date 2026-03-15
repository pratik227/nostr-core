import { finalizeEvent, type NostrEvent, type EventTemplate } from './event.js'

export type ContactEntry = {
  pubkey: string
  relay?: string
  petname?: string
}

/**
 * Create a kind 3 follow list (contact list) event template (unsigned).
 */
export function createFollowListEventTemplate(contacts: ContactEntry[]): EventTemplate {
  const tags: string[][] = contacts.map(c => {
    const tag = ['p', c.pubkey]
    tag.push(c.relay ?? '')
    tag.push(c.petname ?? '')
    // Trim trailing empty strings
    while (tag.length > 1 && tag[tag.length - 1] === '') tag.pop()
    return tag
  })

  return {
    kind: 3,
    tags,
    content: '',
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create and sign a kind 3 follow list event.
 */
export function createFollowListEvent(contacts: ContactEntry[], secretKey: Uint8Array): NostrEvent {
  return finalizeEvent(createFollowListEventTemplate(contacts), secretKey)
}

/**
 * Parse a kind 3 follow list event into contact entries.
 */
export function parseFollowList(event: NostrEvent): ContactEntry[] {
  return event.tags
    .filter(t => t[0] === 'p' && t[1])
    .map(t => {
      const entry: ContactEntry = { pubkey: t[1] }
      if (t[2]) entry.relay = t[2]
      if (t[3]) entry.petname = t[3]
      return entry
    })
}

/**
 * Check if a pubkey is in a follow list event.
 */
export function isFollowing(event: NostrEvent, pubkey: string): boolean {
  return event.tags.some(t => t[0] === 'p' && t[1] === pubkey)
}

/**
 * Get all followed pubkeys from a follow list event.
 */
export function getFollowedPubkeys(event: NostrEvent): string[] {
  return event.tags.filter(t => t[0] === 'p' && t[1]).map(t => t[1])
}
