import { finalizeEvent, verifyEvent, type NostrEvent, type EventTemplate } from './event.js'

/**
 * Create a kind 22242 client authentication event template (unsigned).
 */
export function createAuthEventTemplate(opts: { relay: string; challenge: string }): EventTemplate {
  return {
    kind: 22242,
    tags: [
      ['relay', opts.relay],
      ['challenge', opts.challenge],
    ],
    content: '',
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create and sign a kind 22242 client authentication event.
 */
export function createAuthEvent(opts: { relay: string; challenge: string }, secretKey: Uint8Array): NostrEvent {
  return finalizeEvent(createAuthEventTemplate(opts), secretKey)
}

/**
 * Verify a kind 22242 authentication event.
 */
export function verifyAuthEvent(event: NostrEvent, challenge: string, relayUrl: string): boolean {
  if (event.kind !== 22242) return false
  if (!verifyEvent(event)) return false

  const relayTag = event.tags.find(t => t[0] === 'relay')
  const challengeTag = event.tags.find(t => t[0] === 'challenge')

  if (!relayTag || relayTag[1] !== relayUrl) return false
  if (!challengeTag || challengeTag[1] !== challenge) return false

  return true
}
