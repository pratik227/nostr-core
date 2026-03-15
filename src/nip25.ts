import { finalizeEvent, type NostrEvent, type EventTemplate } from './event.js'

export type Reaction = {
  targetEvent?: { id: string; pubkey: string; kind?: number }
  targetAddress?: string
  content: string
}

/**
 * Create a kind 7 reaction event template (unsigned).
 */
export function createReactionEventTemplate(reaction: Reaction): EventTemplate {
  const tags: string[][] = []

  if (reaction.targetEvent) {
    tags.push(['e', reaction.targetEvent.id])
    tags.push(['p', reaction.targetEvent.pubkey])
    if (reaction.targetEvent.kind !== undefined) {
      tags.push(['k', String(reaction.targetEvent.kind)])
    }
  }

  if (reaction.targetAddress) {
    tags.push(['a', reaction.targetAddress])
  }

  return {
    kind: 7,
    tags,
    content: reaction.content,
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create and sign a kind 7 reaction event.
 */
export function createReactionEvent(reaction: Reaction, secretKey: Uint8Array): NostrEvent {
  return finalizeEvent(createReactionEventTemplate(reaction), secretKey)
}

/**
 * Parse a kind 7 reaction event.
 */
export function parseReaction(event: NostrEvent): {
  targetEventId?: string
  targetPubkey?: string
  targetKind?: number
  targetAddress?: string
  content: string
  isPositive: boolean
  isNegative: boolean
  emoji?: string
} {
  let targetEventId: string | undefined
  let targetPubkey: string | undefined
  let targetKind: number | undefined
  let targetAddress: string | undefined

  for (const tag of event.tags) {
    if (tag[0] === 'e') targetEventId = tag[1]
    else if (tag[0] === 'p') targetPubkey = tag[1]
    else if (tag[0] === 'k') targetKind = parseInt(tag[1], 10)
    else if (tag[0] === 'a') targetAddress = tag[1]
  }

  const content = event.content
  const isPositive = content === '+' || content === ''
  const isNegative = content === '-'
  const emoji = !isPositive && !isNegative ? content : undefined

  return { targetEventId, targetPubkey, targetKind, targetAddress, content, isPositive, isNegative, emoji }
}
