import { decode, type DecodedResult } from './nip19.js'

export type ContentReference = {
  uri: string
  decoded: DecodedResult
  start: number
  end: number
}

const NOSTR_MENTION_REGEX = /nostr:(npub|nprofile|note|nevent|naddr)1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+/g

/**
 * Extract all nostr: references from content text.
 */
export function extractReferences(content: string): ContentReference[] {
  const refs: ContentReference[] = []
  let match: RegExpExecArray | null

  const regex = new RegExp(NOSTR_MENTION_REGEX.source, 'g')
  while ((match = regex.exec(content)) !== null) {
    try {
      const entity = match[0].slice(6) // remove "nostr:" prefix
      const decoded = decode(entity)
      refs.push({
        uri: match[0],
        decoded,
        start: match.index,
        end: match.index + match[0].length,
      })
    } catch {
      // skip invalid entities
    }
  }

  return refs
}

/**
 * Replace all nostr: references in content using a replacer function.
 */
export function replaceReferences(content: string, replacer: (ref: ContentReference) => string): string {
  const refs = extractReferences(content)
  if (refs.length === 0) return content

  let result = ''
  let lastIndex = 0

  for (const ref of refs) {
    result += content.slice(lastIndex, ref.start)
    result += replacer(ref)
    lastIndex = ref.end
  }

  result += content.slice(lastIndex)
  return result
}
