import { decode, type DecodedResult } from './nip19.js'

const NOSTR_URI_REGEX = /^nostr:(npub|nprofile|note|nevent|naddr|nsec)1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$/

/**
 * Encode a NIP-19 bech32 entity as a nostr: URI.
 */
export function encodeNostrURI(nip19Entity: string): string {
  return `nostr:${nip19Entity}`
}

/**
 * Decode a nostr: URI into a NIP-19 decoded result.
 */
export function decodeNostrURI(uri: string): DecodedResult {
  if (!uri.startsWith('nostr:')) {
    throw new Error('Invalid nostr URI: must start with "nostr:"')
  }
  return decode(uri.slice(6))
}

/**
 * Check if a string is a valid nostr: URI.
 */
export function isNostrURI(str: string): boolean {
  return NOSTR_URI_REGEX.test(str)
}
