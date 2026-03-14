import type { NostrEvent, EventTemplate } from './event.js'

export type ProxyProtocol = 'activitypub' | 'atproto' | 'rss' | 'web' | string

export type ProxyTag = {
  id: string
  protocol: ProxyProtocol
}

/**
 * Add a proxy tag to event tags, indicating the event was bridged from another protocol.
 */
export function addProxyTag(tags: string[][], id: string, protocol: ProxyProtocol): string[][] {
  return [...tags, ['proxy', id, protocol]]
}

/**
 * Get proxy tags from an event.
 */
export function getProxyTags(event: NostrEvent | EventTemplate): ProxyTag[] {
  return event.tags
    .filter(t => t[0] === 'proxy' && t[1] && t[2])
    .map(t => ({ id: t[1], protocol: t[2] as ProxyProtocol }))
}

/**
 * Check if an event was bridged from another protocol.
 */
export function isProxied(event: NostrEvent | EventTemplate): boolean {
  return event.tags.some(t => t[0] === 'proxy' && t[1] && t[2])
}

/**
 * Get the first proxy tag matching a specific protocol.
 */
export function getProxyByProtocol(event: NostrEvent | EventTemplate, protocol: ProxyProtocol): ProxyTag | undefined {
  const tag = event.tags.find(t => t[0] === 'proxy' && t[2] === protocol)
  if (!tag) return undefined
  return { id: tag[1], protocol: tag[2] as ProxyProtocol }
}
