import type { NostrEvent } from './event.js'

/**
 * Add an "alt" tag to a tag array, describing the event for clients
 * that don't support the event kind.
 */
export function addAltTag(tags: string[][], description: string): string[][] {
  return [...tags.filter(t => t[0] !== 'alt'), ['alt', description]]
}

/**
 * Extract the "alt" tag value from an event.
 */
export function getAltTag(event: NostrEvent): string | undefined {
  const tag = event.tags.find(t => t[0] === 'alt')
  return tag?.[1]
}
