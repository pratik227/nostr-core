import type { NostrEvent, EventTemplate } from './event.js'

/**
 * Add an expiration tag to event tags.
 */
export function addExpiration(tags: string[][], expiration: number): string[][] {
  const filtered = tags.filter(t => t[0] !== 'expiration')
  return [...filtered, ['expiration', String(expiration)]]
}

/**
 * Get the expiration timestamp from an event, or undefined if none.
 */
export function getExpiration(event: NostrEvent | EventTemplate): number | undefined {
  const tag = event.tags.find(t => t[0] === 'expiration')
  if (!tag || !tag[1]) return undefined
  return parseInt(tag[1], 10)
}

/**
 * Check if an event has expired (expiration timestamp is in the past).
 */
export function isExpired(event: NostrEvent | EventTemplate, now?: number): boolean {
  const expiration = getExpiration(event)
  if (expiration === undefined) return false
  return expiration < (now ?? Math.floor(Date.now() / 1000))
}
