import { finalizeEvent, type NostrEvent, type EventTemplate } from './event.js'
import { getConversationKey, encrypt, decrypt } from './nip44.js'
import { getPublicKey } from './crypto.js'

export type ListItem = {
  tag: string
  value: string
  extra?: string[]
}

export type ParsedList = {
  kind: number
  identifier?: string
  publicItems: ListItem[]
  privateItems: ListItem[]
}

function tagsToItems(tags: string[][]): ListItem[] {
  return tags
    .filter(t => t.length >= 2)
    .map(t => ({
      tag: t[0],
      value: t[1],
      extra: t.length > 2 ? t.slice(2) : undefined,
    }))
}

function itemsToTags(items: ListItem[]): string[][] {
  return items.map(item => {
    const tag = [item.tag, item.value]
    if (item.extra) tag.push(...item.extra)
    return tag
  })
}

/**
 * Create a list event template (unsigned).
 * If privateItems and secretKey are provided, they are NIP-44 self-encrypted into the content.
 */
export function createListEventTemplate(opts: {
  kind: number
  identifier?: string
  publicItems: ListItem[]
  privateItems?: ListItem[]
  secretKey?: Uint8Array
}): EventTemplate {
  const tags = itemsToTags(opts.publicItems)

  if (opts.identifier !== undefined) {
    tags.unshift(['d', opts.identifier])
  }

  let content = ''
  if (opts.privateItems && opts.privateItems.length > 0 && opts.secretKey) {
    const pubkey = getPublicKey(opts.secretKey)
    const conversationKey = getConversationKey(opts.secretKey, pubkey)
    const privateTags = itemsToTags(opts.privateItems)
    content = encrypt(JSON.stringify(privateTags), conversationKey)
  }

  return {
    kind: opts.kind,
    tags,
    content,
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create and sign a list event.
 */
export function createListEvent(
  opts: {
    kind: number
    identifier?: string
    publicItems: ListItem[]
    privateItems?: ListItem[]
  },
  secretKey: Uint8Array,
): NostrEvent {
  return finalizeEvent(
    createListEventTemplate({ ...opts, secretKey }),
    secretKey,
  )
}

/**
 * Parse a list event. If secretKey is provided, decrypt private items.
 */
export function parseList(event: NostrEvent, secretKey?: Uint8Array): ParsedList {
  const result: ParsedList = {
    kind: event.kind,
    publicItems: [],
    privateItems: [],
  }

  const publicTags = event.tags.filter(t => t[0] !== 'd')
  const dTag = event.tags.find(t => t[0] === 'd')

  if (dTag) result.identifier = dTag[1]
  result.publicItems = tagsToItems(publicTags)

  if (event.content && secretKey) {
    try {
      const pubkey = getPublicKey(secretKey)
      const conversationKey = getConversationKey(secretKey, pubkey)
      const decrypted = decrypt(event.content, conversationKey)
      const privateTags = JSON.parse(decrypted) as string[][]
      result.privateItems = tagsToItems(privateTags)
    } catch {
      // Decryption failed - leave privateItems empty
    }
  }

  return result
}

/**
 * Get event IDs from a parsed list.
 */
export function getEventIds(list: ParsedList): string[] {
  return [...list.publicItems, ...list.privateItems]
    .filter(i => i.tag === 'e')
    .map(i => i.value)
}

/**
 * Get pubkeys from a parsed list.
 */
export function getPubkeys(list: ParsedList): string[] {
  return [...list.publicItems, ...list.privateItems]
    .filter(i => i.tag === 'p')
    .map(i => i.value)
}

/**
 * Get hashtags from a parsed list.
 */
export function getHashtags(list: ParsedList): string[] {
  return [...list.publicItems, ...list.privateItems]
    .filter(i => i.tag === 't')
    .map(i => i.value)
}

/**
 * Get relay URLs from a parsed list.
 */
export function getRelayUrls(list: ParsedList): string[] {
  return [...list.publicItems, ...list.privateItems]
    .filter(i => i.tag === 'relay')
    .map(i => i.value)
}

/**
 * Get parameterized replaceable event addresses from a parsed list.
 */
export function getAddresses(list: ParsedList): string[] {
  return [...list.publicItems, ...list.privateItems]
    .filter(i => i.tag === 'a')
    .map(i => i.value)
}
