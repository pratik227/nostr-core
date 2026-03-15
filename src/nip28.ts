import { finalizeEvent, type NostrEvent, type EventTemplate } from './event.js'

export type ChannelMetadata = {
  name: string
  about?: string
  picture?: string
}

/**
 * Create a kind 40 channel creation event template.
 */
export function createChannelEventTemplate(metadata: ChannelMetadata): EventTemplate {
  return {
    kind: 40,
    tags: [],
    content: JSON.stringify(metadata),
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create and sign a kind 40 channel creation event.
 */
export function createChannelEvent(metadata: ChannelMetadata, secretKey: Uint8Array): NostrEvent {
  return finalizeEvent(createChannelEventTemplate(metadata), secretKey)
}

/**
 * Create a kind 41 channel metadata update event template.
 */
export function createChannelMetadataEventTemplate(channelId: string, metadata: ChannelMetadata, recommendedRelay?: string): EventTemplate {
  return {
    kind: 41,
    tags: [['e', channelId, recommendedRelay ?? '']],
    content: JSON.stringify(metadata),
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create and sign a kind 41 channel metadata update event.
 */
export function createChannelMetadataEvent(channelId: string, metadata: ChannelMetadata, secretKey: Uint8Array, recommendedRelay?: string): NostrEvent {
  return finalizeEvent(createChannelMetadataEventTemplate(channelId, metadata, recommendedRelay), secretKey)
}

/**
 * Create a kind 42 channel message event template.
 */
export function createChannelMessageEventTemplate(channelId: string, content: string, recommendedRelay?: string, replyTo?: string): EventTemplate {
  const tags: string[][] = [['e', channelId, recommendedRelay ?? '', 'root']]

  if (replyTo) {
    tags.push(['e', replyTo, recommendedRelay ?? '', 'reply'])
  }

  return {
    kind: 42,
    tags,
    content,
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create and sign a kind 42 channel message event.
 */
export function createChannelMessageEvent(channelId: string, content: string, secretKey: Uint8Array, recommendedRelay?: string, replyTo?: string): NostrEvent {
  return finalizeEvent(createChannelMessageEventTemplate(channelId, content, recommendedRelay, replyTo), secretKey)
}

/**
 * Create a kind 43 channel hide message event template.
 */
export function createChannelHideMessageEventTemplate(messageId: string, reason?: string): EventTemplate {
  return {
    kind: 43,
    tags: [['e', messageId]],
    content: reason ? JSON.stringify({ reason }) : '{}',
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create a kind 44 channel mute user event template.
 */
export function createChannelMuteUserEventTemplate(pubkey: string, reason?: string): EventTemplate {
  return {
    kind: 44,
    tags: [['p', pubkey]],
    content: reason ? JSON.stringify({ reason }) : '{}',
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Parse channel metadata from a kind 40 or 41 event.
 */
export function parseChannelMetadata(event: NostrEvent): ChannelMetadata {
  try {
    const content = JSON.parse(event.content)
    return {
      name: content.name ?? '',
      about: content.about,
      picture: content.picture,
    }
  } catch {
    return { name: '' }
  }
}

/**
 * Parse a channel message event (kind 42).
 * Returns the channel ID, content, and optional reply reference.
 */
export function parseChannelMessage(event: NostrEvent): {
  channelId?: string
  content: string
  replyTo?: string
} {
  let channelId: string | undefined
  let replyTo: string | undefined

  for (const tag of event.tags) {
    if (tag[0] === 'e') {
      if (tag[3] === 'root') {
        channelId = tag[1]
      } else if (tag[3] === 'reply') {
        replyTo = tag[1]
      } else if (!channelId) {
        // Fallback: first e tag without marker is channel ID
        channelId = tag[1]
      }
    }
  }

  return { channelId, content: event.content, replyTo }
}
