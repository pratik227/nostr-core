import type { NostrEvent } from './event.js'

export type ThreadReference = {
  root?: { id: string; relay?: string }
  reply?: { id: string; relay?: string }
  mentions: { id: string; relay?: string }[]
  profiles: string[]
}

/**
 * Parse thread references from a kind 1 event using both
 * the preferred (NIP-10 markers) and deprecated (positional) formats.
 */
export function parseThread(event: NostrEvent): ThreadReference {
  const result: ThreadReference = { mentions: [], profiles: [] }

  const eTags = event.tags.filter(t => t[0] === 'e')
  const pTags = event.tags.filter(t => t[0] === 'p')

  result.profiles = pTags.map(t => t[1])

  // Check if markers are present (preferred format)
  const hasMarkers = eTags.some(t => t[3] === 'root' || t[3] === 'reply' || t[3] === 'mention')

  if (hasMarkers) {
    for (const tag of eTags) {
      const ref = { id: tag[1], relay: tag[2] || undefined }
      switch (tag[3]) {
        case 'root':
          result.root = ref
          break
        case 'reply':
          result.reply = ref
          break
        case 'mention':
          result.mentions.push(ref)
          break
        default:
          result.mentions.push(ref)
          break
      }
    }
  } else {
    // Deprecated positional format
    if (eTags.length === 1) {
      result.root = { id: eTags[0][1], relay: eTags[0][2] || undefined }
    } else if (eTags.length >= 2) {
      result.root = { id: eTags[0][1], relay: eTags[0][2] || undefined }
      result.reply = { id: eTags[eTags.length - 1][1], relay: eTags[eTags.length - 1][2] || undefined }
      for (let i = 1; i < eTags.length - 1; i++) {
        result.mentions.push({ id: eTags[i][1], relay: eTags[i][2] || undefined })
      }
    }
  }

  return result
}

/**
 * Build thread tags for a reply event using the preferred marker format.
 */
export function buildThreadTags(opts: {
  root?: { id: string; relay?: string }
  reply?: { id: string; relay?: string }
  mentions?: { id: string; relay?: string }[]
  profiles?: string[]
}): string[][] {
  const tags: string[][] = []

  if (opts.root) {
    tags.push(['e', opts.root.id, opts.root.relay ?? '', 'root'])
  }

  if (opts.reply) {
    tags.push(['e', opts.reply.id, opts.reply.relay ?? '', 'reply'])
  }

  if (opts.mentions) {
    for (const m of opts.mentions) {
      tags.push(['e', m.id, m.relay ?? '', 'mention'])
    }
  }

  if (opts.profiles) {
    for (const p of opts.profiles) {
      tags.push(['p', p])
    }
  }

  return tags
}
