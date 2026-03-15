import { getEventHash, type NostrEvent, type EventTemplate } from './event.js'

/**
 * Count the number of leading zero bits in an event ID (hex string).
 */
export function countLeadingZeroBits(hex: string): number {
  let count = 0
  for (let i = 0; i < hex.length; i++) {
    const nibble = parseInt(hex[i], 16)
    if (nibble === 0) {
      count += 4
    } else {
      // Count leading zero bits of this nibble
      count += Math.clz32(nibble) - 28
      break
    }
  }
  return count
}

/**
 * Get the proof-of-work difficulty of an event (leading zero bits of the event ID).
 */
export function getPowDifficulty(event: NostrEvent): number {
  return countLeadingZeroBits(event.id)
}

/**
 * Get the target difficulty committed to by the nonce tag.
 * Returns 0 if no nonce tag with target is present.
 */
export function getTargetDifficulty(event: NostrEvent | EventTemplate): number {
  const nonceTag = event.tags.find(t => t[0] === 'nonce')
  if (!nonceTag || !nonceTag[2]) return 0
  return parseInt(nonceTag[2], 10) || 0
}

/**
 * Check if an event satisfies a given proof-of-work difficulty.
 * Verifies both the actual difficulty and the committed target difficulty.
 */
export function verifyPow(event: NostrEvent, minDifficulty: number): boolean {
  const actual = getPowDifficulty(event)
  if (actual < minDifficulty) return false

  const target = getTargetDifficulty(event)
  return target >= minDifficulty
}

/**
 * Mine proof-of-work for an event template.
 * Returns the template with a nonce tag achieving the target difficulty.
 * WARNING: This is CPU-intensive and may take a long time for high difficulties.
 */
export function minePow(template: EventTemplate, targetDifficulty: number): EventTemplate {
  // Remove any existing nonce tag
  const tags = template.tags.filter(t => t[0] !== 'nonce')

  let nonce = 0
  while (true) {
    const attempt: EventTemplate = {
      ...template,
      tags: [...tags, ['nonce', String(nonce), String(targetDifficulty)]],
    }

    // We need to compute the hash to check difficulty
    // getEventHash requires a full unsigned event shape, so we build one
    const testEvent = {
      ...attempt,
      pubkey: '0'.repeat(64), // placeholder - actual pubkey set at signing
    }
    const hash = getEventHash(testEvent as any)
    const bits = countLeadingZeroBits(hash)

    if (bits >= targetDifficulty) {
      return attempt
    }

    nonce++
  }
}
