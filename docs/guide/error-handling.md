# Error Handling

nostr-core provides a hierarchy of typed error classes so you can catch and handle specific failure modes.

## Error Hierarchy

```
Error
└── NWCError (code: string)
    ├── NWCWalletError          - wallet rejected the request
    ├── NWCTimeoutError         - generic timeout
    │   ├── NWCPublishTimeoutError  - relay didn't acknowledge the event
    │   └── NWCReplyTimeoutError    - wallet didn't respond in time
    ├── NWCPublishError         - relay rejected the event
    ├── NWCConnectionError      - couldn't connect to relay
    └── NWCDecryptionError      - couldn't decrypt wallet response
```

Every error has a `code` property for programmatic handling:

| Error Class | Code |
|-------------|------|
| `NWCWalletError` | Wallet-specific (e.g. `"INSUFFICIENT_BALANCE"`) |
| `NWCPublishTimeoutError` | `"PUBLISH_TIMEOUT"` |
| `NWCReplyTimeoutError` | `"REPLY_TIMEOUT"` |
| `NWCPublishError` | `"PUBLISH_ERROR"` |
| `NWCConnectionError` | `"CONNECTION_ERROR"` |
| `NWCDecryptionError` | `"DECRYPTION_ERROR"` |

## Catching Errors

### Catch Everything

```ts
import { NWCError } from 'nostr-core'

try {
  await nwc.payInvoice('lnbc...')
} catch (err) {
  if (err instanceof NWCError) {
    console.error(`NWC error [${err.code}]: ${err.message}`)
  }
}
```

### Catch Specific Types

```ts
import {
  NWCWalletError,
  NWCTimeoutError,
  NWCConnectionError,
} from 'nostr-core'

try {
  await nwc.payInvoice('lnbc...')
} catch (err) {
  if (err instanceof NWCWalletError) {
    // The wallet rejected the request
    console.error(`Wallet error [${err.code}]: ${err.message}`)
  } else if (err instanceof NWCTimeoutError) {
    // Catches both publish and reply timeouts
    console.error('Operation timed out:', err.message)
  } else if (err instanceof NWCConnectionError) {
    console.error('Not connected to relay')
  } else {
    throw err
  }
}
```

### Catch by Error Code

```ts
import { NWCError } from 'nostr-core'

try {
  await nwc.payInvoice('lnbc...')
} catch (err) {
  if (err instanceof NWCError) {
    switch (err.code) {
      case 'INSUFFICIENT_BALANCE':
        console.error('Not enough funds')
        break
      case 'REPLY_TIMEOUT':
        console.error('Wallet is not responding')
        break
      case 'CONNECTION_ERROR':
        console.error('Lost connection to relay')
        break
      default:
        console.error(`Error [${err.code}]: ${err.message}`)
    }
  }
}
```

## Timeouts

The NWC client has two configurable timeouts:

```ts
const nwc = new NWC(connectionString)

// Time to wait for relay to acknowledge a published event (default: 5s)
nwc.publishTimeout = 10000

// Time to wait for wallet to reply to a request (default: 60s)
nwc.replyTimeout = 30000
```

Some methods use shorter reply timeouts internally:
- `getInfo()` - 10 seconds
- `getBalance()` - 10 seconds
- `getBudget()` - 10 seconds
- `listTransactions()` - 10 seconds

## Connection Errors

Connection errors are thrown during `connect()`:

```ts
import { NWCConnectionError } from 'nostr-core'

try {
  await nwc.connect()
} catch (err) {
  if (err instanceof NWCConnectionError) {
    console.error('Failed to connect:', err.message)
    // Retry logic, switch relays, etc.
  }
}
```

## Invalid Connection Strings

Parsing errors are thrown from the constructor:

```ts
import { NWCError } from 'nostr-core'

try {
  const nwc = new NWC('invalid-string')
} catch (err) {
  if (err instanceof NWCError && err.code === 'INVALID_CONNECTION_STRING') {
    console.error('Bad connection string:', err.message)
  }
}
```

See the [Errors API reference](/api/errors) for the full class definitions.
