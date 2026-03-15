import type { NostrEvent, EventTemplate } from './event.js'

/**
 * Add a content-warning tag to event tags.
 */
export function addContentWarning(tags: string[][], reason?: string): string[][] {
  const filtered = tags.filter(t => t[0] !== 'content-warning')
  const cwTag = reason ? ['content-warning', reason] : ['content-warning']
  return [...filtered, cwTag]
}

/**
 * Get the content-warning reason from an event, or undefined if none.
 */
export function getContentWarning(event: NostrEvent | EventTemplate): string | undefined {
  const tag = event.tags.find(t => t[0] === 'content-warning')
  if (!tag) return undefined
  return tag[1] ?? ''
}

/**
 * Check if an event has a content-warning tag.
 */
export function hasContentWarning(event: NostrEvent | EventTemplate): boolean {
  return event.tags.some(t => t[0] === 'content-warning')
}
