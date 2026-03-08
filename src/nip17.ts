import { getPublicKey } from './crypto.js'
import type { Rumor } from './nip59.js'
import { createRumor, createSeal, createWrap, unwrap } from './nip59.js'
import type { NostrEvent } from './event.js'

// Kind constants
const DM_KIND = 14

// Types

export type DirectMessage = {
  sender: string
  content: string
  tags: string[][]
  created_at: number
  id: string
}

// Public API

export function wrapDirectMessage(
  content: string,
  senderSecretKey: Uint8Array,
  recipientPubkey: string,
  tags: string[][] = [],
): NostrEvent {
  const senderPubkey = getPublicKey(senderSecretKey)

  const rumor = createRumor(
    {
      kind: DM_KIND,
      tags: [['p', recipientPubkey], ...tags],
      content,
      created_at: Math.floor(Date.now() / 1000),
    },
    senderPubkey,
  )

  const seal = createSeal(rumor, senderSecretKey, recipientPubkey)
  return createWrap(seal, recipientPubkey)
}

export function unwrapDirectMessage(
  wrap: NostrEvent,
  recipientSecretKey: Uint8Array,
): DirectMessage {
  const rumor = unwrap(wrap, recipientSecretKey)

  if (rumor.kind !== DM_KIND) {
    throw new Error(`Expected kind ${DM_KIND} direct message, got kind ${rumor.kind}`)
  }

  return {
    sender: rumor.pubkey,
    content: rumor.content,
    tags: rumor.tags,
    created_at: rumor.created_at,
    id: rumor.id,
  }
}
