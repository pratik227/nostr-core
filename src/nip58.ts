import { finalizeEvent, type NostrEvent, type EventTemplate } from './event.js'

// Badge Definition (kind 30009)

export type BadgeDefinition = {
  identifier: string
  name?: string
  description?: string
  image?: string
  thumbs?: string[]
}

/**
 * Create a kind 30009 badge definition event template.
 */
export function createBadgeDefinitionTemplate(badge: BadgeDefinition): EventTemplate {
  const tags: string[][] = [['d', badge.identifier]]

  if (badge.name) tags.push(['name', badge.name])
  if (badge.description) tags.push(['description', badge.description])
  if (badge.image) tags.push(['image', badge.image])
  if (badge.thumbs) {
    for (const thumb of badge.thumbs) tags.push(['thumb', thumb])
  }

  return {
    kind: 30009,
    tags,
    content: '',
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create and sign a badge definition event.
 */
export function createBadgeDefinitionEvent(badge: BadgeDefinition, secretKey: Uint8Array): NostrEvent {
  return finalizeEvent(createBadgeDefinitionTemplate(badge), secretKey)
}

/**
 * Parse a kind 30009 badge definition event.
 */
export function parseBadgeDefinition(event: NostrEvent): BadgeDefinition {
  const result: BadgeDefinition = { identifier: '' }
  const thumbs: string[] = []

  for (const tag of event.tags) {
    switch (tag[0]) {
      case 'd':
        result.identifier = tag[1] ?? ''
        break
      case 'name':
        result.name = tag[1]
        break
      case 'description':
        result.description = tag[1]
        break
      case 'image':
        result.image = tag[1]
        break
      case 'thumb':
        if (tag[1]) thumbs.push(tag[1])
        break
    }
  }

  if (thumbs.length > 0) result.thumbs = thumbs

  return result
}

// Badge Award (kind 8)

export type BadgeAward = {
  badgeAddress: string
  recipients: string[]
}

/**
 * Create a kind 8 badge award event template.
 */
export function createBadgeAwardTemplate(award: BadgeAward): EventTemplate {
  const tags: string[][] = [['a', award.badgeAddress]]

  for (const recipient of award.recipients) {
    tags.push(['p', recipient])
  }

  return {
    kind: 8,
    tags,
    content: '',
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create and sign a badge award event.
 */
export function createBadgeAwardEvent(award: BadgeAward, secretKey: Uint8Array): NostrEvent {
  return finalizeEvent(createBadgeAwardTemplate(award), secretKey)
}

/**
 * Parse a kind 8 badge award event.
 */
export function parseBadgeAward(event: NostrEvent): BadgeAward {
  let badgeAddress = ''
  const recipients: string[] = []

  for (const tag of event.tags) {
    if (tag[0] === 'a') badgeAddress = tag[1]
    else if (tag[0] === 'p') recipients.push(tag[1])
  }

  return { badgeAddress, recipients }
}

// Profile Badges (kind 30008)

export type ProfileBadge = {
  badgeAddress: string
  awardEventId: string
}

/**
 * Create a kind 30008 profile badges event template.
 */
export function createProfileBadgesTemplate(badges: ProfileBadge[]): EventTemplate {
  const tags: string[][] = [['d', 'profile_badges']]

  for (const badge of badges) {
    tags.push(['a', badge.badgeAddress])
    tags.push(['e', badge.awardEventId])
  }

  return {
    kind: 30008,
    tags,
    content: '',
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create and sign a profile badges event.
 */
export function createProfileBadgesEvent(badges: ProfileBadge[], secretKey: Uint8Array): NostrEvent {
  return finalizeEvent(createProfileBadgesTemplate(badges), secretKey)
}

/**
 * Parse a kind 30008 profile badges event.
 */
export function parseProfileBadges(event: NostrEvent): ProfileBadge[] {
  const badges: ProfileBadge[] = []

  // Tags come in pairs: ['a', address], ['e', awardId]
  const tags = event.tags.filter(t => t[0] === 'a' || t[0] === 'e')

  let currentAddress: string | undefined
  for (const tag of tags) {
    if (tag[0] === 'a') {
      currentAddress = tag[1]
    } else if (tag[0] === 'e' && currentAddress) {
      badges.push({ badgeAddress: currentAddress, awardEventId: tag[1] })
      currentAddress = undefined
    }
  }

  return badges
}

// Extended Badge Proofs

export type BadgeProof =
  | { type: 'pow'; difficulty: number; nonce: string }
  | { type: 'payment'; preimage: string; invoice: string }
  | { type: 'membership'; groupId: string; membershipEventId: string }

export type BadgeRequest = {
  badgeAddress: string
  proof?: BadgeProof
}

/**
 * Create a badge request event template with optional proof.
 */
export function createBadgeRequestTemplate(request: BadgeRequest): EventTemplate {
  const tags: string[][] = [['a', request.badgeAddress]]

  if (request.proof) {
    switch (request.proof.type) {
      case 'pow':
        tags.push(['proof', 'pow', String(request.proof.difficulty), request.proof.nonce])
        break
      case 'payment':
        tags.push(['proof', 'payment', request.proof.preimage, request.proof.invoice])
        break
      case 'membership':
        tags.push(['proof', 'membership', request.proof.groupId, request.proof.membershipEventId])
        break
    }
  }

  return {
    kind: 8,
    tags,
    content: '',
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Verify a badge proof from event tags.
 */
export function verifyBadgeProof(event: NostrEvent): BadgeProof | undefined {
  const proofTag = event.tags.find(t => t[0] === 'proof')
  if (!proofTag) return undefined

  switch (proofTag[1]) {
    case 'pow':
      return { type: 'pow', difficulty: parseInt(proofTag[2], 10), nonce: proofTag[3] }
    case 'payment':
      return { type: 'payment', preimage: proofTag[2], invoice: proofTag[3] }
    case 'membership':
      return { type: 'membership', groupId: proofTag[2], membershipEventId: proofTag[3] }
    default:
      return undefined
  }
}

/**
 * Validate that a badge award event references the correct badge definition.
 */
export function validateBadgeAward(award: NostrEvent, definition: NostrEvent): boolean {
  if (award.kind !== 8 || definition.kind !== 30009) return false

  const awardAddress = award.tags.find(t => t[0] === 'a')?.[1]
  if (!awardAddress) return false

  const defIdentifier = definition.tags.find(t => t[0] === 'd')?.[1]
  if (!defIdentifier) return false

  // Address format: kind:pubkey:identifier
  const expectedAddress = `30009:${definition.pubkey}:${defIdentifier}`
  return awardAddress === expectedAddress
}
