import { finalizeEvent, type NostrEvent, type EventTemplate } from './event.js'

export type DeletionTarget =
  | { type: 'event'; id: string }
  | { type: 'address'; address: string }

export type DeletionRequest = {
  targets: DeletionTarget[]
  reason?: string
}

/**
 * Create a kind 5 deletion event template (unsigned).
 */
export function createDeletionEventTemplate(request: DeletionRequest): EventTemplate {
  const tags: string[][] = []
  const kinds = new Set<number>()

  for (const target of request.targets) {
    if (target.type === 'event') {
      tags.push(['e', target.id])
    } else {
      tags.push(['a', target.address])
      const kindStr = target.address.split(':')[0]
      if (kindStr) kinds.add(parseInt(kindStr, 10))
    }
  }

  for (const kind of kinds) {
    tags.push(['k', String(kind)])
  }

  return {
    kind: 5,
    tags,
    content: request.reason ?? '',
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create and sign a kind 5 deletion event.
 */
export function createDeletionEvent(request: DeletionRequest, secretKey: Uint8Array): NostrEvent {
  return finalizeEvent(createDeletionEventTemplate(request), secretKey)
}

/**
 * Parse a kind 5 deletion event.
 */
export function parseDeletion(event: NostrEvent): {
  eventIds: string[]
  addresses: string[]
  kinds: number[]
  reason: string
} {
  const eventIds: string[] = []
  const addresses: string[] = []
  const kinds: number[] = []

  for (const tag of event.tags) {
    if (tag[0] === 'e') eventIds.push(tag[1])
    else if (tag[0] === 'a') addresses.push(tag[1])
    else if (tag[0] === 'k') kinds.push(parseInt(tag[1], 10))
  }

  return { eventIds, addresses, kinds, reason: event.content }
}

/**
 * Check if a deletion event targets a specific event.
 */
export function isDeletionOf(deletion: NostrEvent, target: NostrEvent): boolean {
  if (deletion.kind !== 5) return false
  if (deletion.pubkey !== target.pubkey) return false

  for (const tag of deletion.tags) {
    if (tag[0] === 'e' && tag[1] === target.id) return true
  }

  return false
}
