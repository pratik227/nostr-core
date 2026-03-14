import { finalizeEvent, type NostrEvent, type EventTemplate } from './event.js'

export type GroupMetadata = {
  id: string
  name?: string
  about?: string
  picture?: string
  isOpen?: boolean
  isPublic?: boolean
}

export type GroupAdminAction =
  | { type: 'add-user'; pubkey: string }
  | { type: 'remove-user'; pubkey: string }
  | { type: 'edit-metadata'; name?: string; about?: string; picture?: string }
  | { type: 'delete-event'; eventId: string }
  | { type: 'add-permission'; pubkey: string; permission: string }
  | { type: 'remove-permission'; pubkey: string; permission: string }

/**
 * Create a kind 9 group chat message event template.
 */
export function createGroupChatTemplate(groupId: string, content: string, replyTo?: string): EventTemplate {
  const tags: string[][] = [['h', groupId]]
  if (replyTo) tags.push(['e', replyTo, '', 'reply'])

  return {
    kind: 9,
    tags,
    content,
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create and sign a group chat message event.
 */
export function createGroupChatEvent(
  groupId: string,
  content: string,
  secretKey: Uint8Array,
  replyTo?: string,
): NostrEvent {
  return finalizeEvent(createGroupChatTemplate(groupId, content, replyTo), secretKey)
}

/**
 * Create a group admin action event template.
 */
export function createGroupAdminTemplate(groupId: string, action: GroupAdminAction): EventTemplate {
  const tags: string[][] = [['h', groupId]]
  let kind: number

  switch (action.type) {
    case 'add-user':
      kind = 9000
      tags.push(['p', action.pubkey])
      break
    case 'remove-user':
      kind = 9001
      tags.push(['p', action.pubkey])
      break
    case 'edit-metadata':
      kind = 9002
      if (action.name) tags.push(['name', action.name])
      if (action.about) tags.push(['about', action.about])
      if (action.picture) tags.push(['picture', action.picture])
      break
    case 'delete-event':
      kind = 9005
      tags.push(['e', action.eventId])
      break
    case 'add-permission':
      kind = 9003
      tags.push(['p', action.pubkey])
      tags.push(['permission', action.permission])
      break
    case 'remove-permission':
      kind = 9004
      tags.push(['p', action.pubkey])
      tags.push(['permission', action.permission])
      break
  }

  return {
    kind: kind!,
    tags,
    content: '',
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Parse a kind 39000 group metadata event.
 */
export function parseGroupMetadata(event: NostrEvent): GroupMetadata {
  const result: GroupMetadata = { id: '' }

  for (const tag of event.tags) {
    switch (tag[0]) {
      case 'd':
        result.id = tag[1] ?? ''
        break
      case 'name':
        result.name = tag[1]
        break
      case 'about':
        result.about = tag[1]
        break
      case 'picture':
        result.picture = tag[1]
        break
      case 'open':
        result.isOpen = true
        break
      case 'closed':
        result.isOpen = false
        break
      case 'public':
        result.isPublic = true
        break
      case 'private':
        result.isPublic = false
        break
    }
  }

  return result
}

/**
 * Parse a kind 39002 group members event.
 */
export function parseGroupMembers(event: NostrEvent): string[] {
  return event.tags.filter(t => t[0] === 'p').map(t => t[1])
}

/**
 * Parse a kind 39001 group admins event.
 */
export function parseGroupAdmins(event: NostrEvent): Array<{ pubkey: string; permissions: string[] }> {
  const admins: Array<{ pubkey: string; permissions: string[] }> = []

  for (const tag of event.tags) {
    if (tag[0] === 'p') {
      const permissions = tag.slice(3).filter(Boolean)
      admins.push({ pubkey: tag[1], permissions })
    }
  }

  return admins
}
