import { finalizeEvent, type NostrEvent, type EventTemplate } from './event.js'

export type ReportType = 'nudity' | 'malware' | 'profanity' | 'illegal' | 'spam' | 'impersonation' | 'other'

export type ReportTarget =
  | { type: 'pubkey'; pubkey: string; reportType: ReportType }
  | { type: 'event'; eventId: string; authorPubkey: string; reportType: ReportType }

/**
 * Create a kind 1984 report event template.
 */
export function createReportEventTemplate(targets: ReportTarget[], content?: string): EventTemplate {
  const tags: string[][] = []

  for (const target of targets) {
    if (target.type === 'pubkey') {
      tags.push(['p', target.pubkey, target.reportType])
    } else {
      tags.push(['e', target.eventId, target.reportType])
      tags.push(['p', target.authorPubkey])
    }
  }

  return {
    kind: 1984,
    tags,
    content: content ?? '',
    created_at: Math.floor(Date.now() / 1000),
  }
}

/**
 * Create and sign a kind 1984 report event.
 */
export function createReportEvent(targets: ReportTarget[], secretKey: Uint8Array, content?: string): NostrEvent {
  return finalizeEvent(createReportEventTemplate(targets, content), secretKey)
}

/**
 * Parse a kind 1984 report event.
 */
export function parseReport(event: NostrEvent): {
  targets: ReportTarget[]
  content: string
} {
  const targets: ReportTarget[] = []
  const eTags = event.tags.filter(t => t[0] === 'e')
  const pTags = event.tags.filter(t => t[0] === 'p')

  // Event reports: e tags with report type
  for (const eTag of eTags) {
    if (eTag[2]) {
      const authorTag = pTags.find(p => !p[2]) // p tag without report type
      targets.push({
        type: 'event',
        eventId: eTag[1],
        authorPubkey: authorTag?.[1] ?? '',
        reportType: eTag[2] as ReportType,
      })
    }
  }

  // Pubkey reports: p tags with report type
  for (const pTag of pTags) {
    if (pTag[2]) {
      targets.push({
        type: 'pubkey',
        pubkey: pTag[1],
        reportType: pTag[2] as ReportType,
      })
    }
  }

  return { targets, content: event.content }
}
