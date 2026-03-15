import { finalizeEvent, type NostrEvent, type EventTemplate } from './event.js'

export type RepostTarget = {
  id: string
  pubkey: string
  relay?: string
  kind?: number
}

/**
 * Create a kind 6 repost event template (for kind 1 text notes) or
 * kind 16 generic repost event template (for other kinds).
 * The original event JSON is placed in content.
 */
export function createRepostEventTemplate(target: RepostTarget, originalEvent?: NostrEvent): EventTemplate {
  const isGeneric = target.kind !== undefined && target.kind !== 1
  const kind = isGeneric ? 16 : 6
  const tags: string[][] = [
    ['e', target.id, target.relay ?? ''],
    ['p', target.pubkey],
  ]

  if (isGeneric && target.kind !== undefined) {
    tags.push(['k', String(target.kind)])
  }

  return {
    kind,
    tags,
    content: originalEvent ? JSON.stringify(originalEvent) : '',
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create and sign a repost event.
 */
export function createRepostEvent(target: RepostTarget, secretKey: Uint8Array, originalEvent?: NostrEvent): NostrEvent {
  return finalizeEvent(createRepostEventTemplate(target, originalEvent), secretKey)
}

/**
 * Parse a kind 6 or kind 16 repost event.
 */
export function parseRepost(event: NostrEvent): {
  targetEventId?: string
  targetPubkey?: string
  targetRelay?: string
  targetKind?: number
  embeddedEvent?: NostrEvent
} {
  let targetEventId: string | undefined
  let targetPubkey: string | undefined
  let targetRelay: string | undefined
  let targetKind: number | undefined

  for (const tag of event.tags) {
    if (tag[0] === 'e') {
      targetEventId = tag[1]
      if (tag[2]) targetRelay = tag[2]
    } else if (tag[0] === 'p') {
      targetPubkey = tag[1]
    } else if (tag[0] === 'k') {
      targetKind = parseInt(tag[1], 10)
    }
  }

  // For kind 6 reposts, the target kind is implicitly 1
  if (event.kind === 6 && targetKind === undefined) {
    targetKind = 1
  }

  let embeddedEvent: NostrEvent | undefined
  if (event.content) {
    try {
      embeddedEvent = JSON.parse(event.content) as NostrEvent
    } catch {
      // content may be empty or not valid JSON
    }
  }

  return { targetEventId, targetPubkey, targetRelay, targetKind, embeddedEvent }
}
