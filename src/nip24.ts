import type { NostrEvent } from './event.js'

export type ExtendedMetadata = {
  display_name?: string
  website?: string
  banner?: string
  bot?: boolean
  birthday?: string
  [key: string]: unknown
}

export type UniversalTags = {
  references?: string[]
  hashtags?: string[]
  title?: string
}

/**
 * Parse extended metadata fields from a kind 0 event content JSON.
 */
export function parseExtendedMetadata(event: NostrEvent): ExtendedMetadata {
  try {
    const content = JSON.parse(event.content) as Record<string, unknown>
    const result: ExtendedMetadata = {}

    if (typeof content.display_name === 'string') result.display_name = content.display_name
    if (typeof content.website === 'string') result.website = content.website
    if (typeof content.banner === 'string') result.banner = content.banner
    if (typeof content.bot === 'boolean') result.bot = content.bot
    if (typeof content.birthday === 'string') result.birthday = content.birthday

    // Include any other fields
    for (const [key, value] of Object.entries(content)) {
      if (!(key in result)) {
        result[key] = value
      }
    }

    return result
  } catch {
    return {}
  }
}

/**
 * Build a JSON content string from extended metadata.
 */
export function buildMetadataContent(metadata: ExtendedMetadata): string {
  return JSON.stringify(metadata)
}

/**
 * Parse universal tags (r, t, title) from any event.
 */
export function parseUniversalTags(event: NostrEvent): UniversalTags {
  const result: UniversalTags = {}

  const references: string[] = []
  const hashtags: string[] = []

  for (const tag of event.tags) {
    if (tag[0] === 'r' && tag[1]) references.push(tag[1])
    else if (tag[0] === 't' && tag[1]) hashtags.push(tag[1])
    else if (tag[0] === 'title' && tag[1]) result.title = tag[1]
  }

  if (references.length > 0) result.references = references
  if (hashtags.length > 0) result.hashtags = hashtags

  return result
}

/**
 * Build universal tags (r, t, title) from structured input.
 */
export function buildUniversalTags(tags: UniversalTags): string[][] {
  const result: string[][] = []

  if (tags.references) {
    for (const ref of tags.references) result.push(['r', ref])
  }
  if (tags.hashtags) {
    for (const ht of tags.hashtags) result.push(['t', ht])
  }
  if (tags.title) {
    result.push(['title', tags.title])
  }

  return result
}
