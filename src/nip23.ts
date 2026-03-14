import { finalizeEvent, type NostrEvent, type EventTemplate } from './event.js'

export type LongFormContent = {
  identifier: string
  title?: string
  image?: string
  summary?: string
  publishedAt?: number
  hashtags?: string[]
  content: string
  isDraft?: boolean
}

/**
 * Create a kind 30023 (or 30024 draft) long-form content event template.
 */
export function createLongFormEventTemplate(article: LongFormContent): EventTemplate {
  const kind = article.isDraft ? 30024 : 30023
  const tags: string[][] = [['d', article.identifier]]

  if (article.title) tags.push(['title', article.title])
  if (article.image) tags.push(['image', article.image])
  if (article.summary) tags.push(['summary', article.summary])
  if (article.publishedAt !== undefined) tags.push(['published_at', String(article.publishedAt)])
  if (article.hashtags) {
    for (const tag of article.hashtags) tags.push(['t', tag])
  }

  return {
    kind,
    tags,
    content: article.content,
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create and sign a long-form content event.
 */
export function createLongFormEvent(article: LongFormContent, secretKey: Uint8Array): NostrEvent {
  return finalizeEvent(createLongFormEventTemplate(article), secretKey)
}

/**
 * Parse a kind 30023 or 30024 long-form content event.
 */
export function parseLongForm(event: NostrEvent): LongFormContent {
  const result: LongFormContent = {
    identifier: '',
    content: event.content,
    isDraft: event.kind === 30024,
  }

  const hashtags: string[] = []

  for (const tag of event.tags) {
    switch (tag[0]) {
      case 'd':
        result.identifier = tag[1] ?? ''
        break
      case 'title':
        result.title = tag[1]
        break
      case 'image':
        result.image = tag[1]
        break
      case 'summary':
        result.summary = tag[1]
        break
      case 'published_at':
        result.publishedAt = parseInt(tag[1], 10)
        break
      case 't':
        if (tag[1]) hashtags.push(tag[1])
        break
    }
  }

  if (hashtags.length > 0) result.hashtags = hashtags

  return result
}
