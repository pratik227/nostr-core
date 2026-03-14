# NIP-56

Reporting - kind 1984 events for reporting objectionable content or users. Reports can target specific events or pubkeys with a report type classification.

## Import

```ts
import { nip56 } from 'nostr-core'
// or import individual functions
import {
  createReportEventTemplate,
  createReportEvent,
  parseReport,
} from 'nostr-core'
```

## ReportType

```ts
type ReportType = 'nudity' | 'malware' | 'profanity' | 'illegal' | 'spam' | 'impersonation' | 'other'
```

## ReportTarget Type

```ts
type ReportTarget =
  | { type: 'pubkey'; pubkey: string; reportType: ReportType }
  | { type: 'event'; eventId: string; authorPubkey: string; reportType: ReportType }
```

## nip56.createReportEventTemplate

```ts
function createReportEventTemplate(targets: ReportTarget[], content?: string): EventTemplate
```

Creates a kind 1984 report event template.

```ts
// Report a user for impersonation
const template = nip56.createReportEventTemplate([
  { type: 'pubkey', pubkey: 'bad-actor-pk', reportType: 'impersonation' },
])

// Report an event for spam
const eventReport = nip56.createReportEventTemplate([
  { type: 'event', eventId: 'spam-event-id', authorPubkey: 'author-pk', reportType: 'spam' },
], 'This is automated spam')
```

## nip56.createReportEvent

```ts
function createReportEvent(targets: ReportTarget[], secretKey: Uint8Array, content?: string): NostrEvent
```

Creates and signs a kind 1984 report event.

```ts
const report = nip56.createReportEvent(
  [{ type: 'event', eventId: 'event-id', authorPubkey: 'author-pk', reportType: 'spam' }],
  secretKey,
  'Automated spam content',
)
```

## nip56.parseReport

```ts
function parseReport(event: NostrEvent): { targets: ReportTarget[]; content: string }
```

Parses a kind 1984 report event.

```ts
const report = nip56.parseReport(reportEvent)
for (const target of report.targets) {
  if (target.type === 'event') {
    console.log(`Event ${target.eventId} reported as ${target.reportType}`)
  }
}
```

## How It Works

- **Kind 1984** is the report event kind
- Pubkey reports use `p` tags with report type: `['p', pubkey, reportType]`
- Event reports use `e` tags with report type: `['e', eventId, reportType]` plus a `p` tag for the author
- Report types: `nudity`, `malware`, `profanity`, `illegal`, `spam`, `impersonation`, `other`
- The content field can provide additional context about the report
- Reports are public events that relays and clients can use for moderation
- Multiple targets can be reported in a single event
