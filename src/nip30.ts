import type { NostrEvent } from './event.js'

export type CustomEmoji = {
  shortcode: string
  url: string
}

/**
 * Parse custom emoji tags from an event.
 */
export function parseCustomEmojis(event: NostrEvent): CustomEmoji[] {
  return event.tags
    .filter(t => t[0] === 'emoji' && t[1] && t[2])
    .map(t => ({ shortcode: t[1], url: t[2] }))
}

/**
 * Build emoji tags from an array of custom emojis.
 */
export function buildEmojiTags(emojis: CustomEmoji[]): string[][] {
  return emojis.map(e => ['emoji', e.shortcode, e.url])
}

/**
 * Extract emoji shortcodes (`:name:` format) from content text.
 */
export function extractEmojiShortcodes(content: string): string[] {
  const matches = content.match(/:([a-zA-Z0-9_]+):/g)
  if (!matches) return []
  return [...new Set(matches.map(m => m.slice(1, -1)))]
}
