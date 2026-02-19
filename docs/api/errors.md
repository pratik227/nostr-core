# Errors

nostr-core uses a hierarchy of error classes with `code` properties for programmatic handling.

## Import

```ts
import {
  NWCError,
  NWCWalletError,
  NWCTimeoutError,
  NWCPublishTimeoutError,
  NWCReplyTimeoutError,
  NWCPublishError,
  NWCConnectionError,
  NWCDecryptionError,
} from 'nostr-core'
```

## Hierarchy

```
Error
└── NWCError
    ├── NWCWalletError
    ├── NWCTimeoutError
    │   ├── NWCPublishTimeoutError
    │   └── NWCReplyTimeoutError
    ├── NWCPublishError
    ├── NWCConnectionError
    └── NWCDecryptionError
```

## NWCError

```ts
class NWCError extends Error {
  code: string
  constructor(message: string, code: string)
}
```

Base class for all NWC errors. Every error has a `message` and a `code`.

## NWCWalletError

```ts
class NWCWalletError extends NWCError {
  constructor(message: string, code: string)
}
```

The wallet service rejected the request. The `code` contains the wallet's error code (e.g. `"INSUFFICIENT_BALANCE"`, `"QUOTA_EXCEEDED"`).

## NWCTimeoutError

```ts
class NWCTimeoutError extends NWCError {
  constructor(message: string, code?: string)
  // code defaults to 'TIMEOUT'
}
```

Base class for timeout errors.

## NWCPublishTimeoutError

```ts
class NWCPublishTimeoutError extends NWCTimeoutError {
  constructor(message: string)
  // code: 'PUBLISH_TIMEOUT'
}
```

The relay did not acknowledge the published event within the `publishTimeout` window.

## NWCReplyTimeoutError

```ts
class NWCReplyTimeoutError extends NWCTimeoutError {
  constructor(message: string)
  // code: 'REPLY_TIMEOUT'
}
```

The wallet did not reply within the `replyTimeout` window.

## NWCPublishError

```ts
class NWCPublishError extends NWCError {
  constructor(message: string)
  // code: 'PUBLISH_ERROR'
}
```

The relay rejected the published event (NACK).

## NWCConnectionError

```ts
class NWCConnectionError extends NWCError {
  constructor(message: string)
  // code: 'CONNECTION_ERROR'
}
```

Failed to establish a WebSocket connection to the relay.

## NWCDecryptionError

```ts
class NWCDecryptionError extends NWCError {
  constructor(message: string)
  // code: 'DECRYPTION_ERROR'
}
```

Failed to decrypt the wallet's response. Usually indicates a key mismatch.

## Usage Patterns

### Catch by class

```ts
try {
  await nwc.payInvoice('lnbc...')
} catch (err) {
  if (err instanceof NWCWalletError) {
    // Wallet-level rejection
  } else if (err instanceof NWCTimeoutError) {
    // Any timeout (publish or reply)
  } else if (err instanceof NWCConnectionError) {
    // Connection lost
  }
}
```

### Catch by code

```ts
try {
  await nwc.payInvoice('lnbc...')
} catch (err) {
  if (err instanceof NWCError) {
    switch (err.code) {
      case 'INSUFFICIENT_BALANCE':
      case 'QUOTA_EXCEEDED':
        // Handle wallet rejections
        break
      case 'REPLY_TIMEOUT':
        // Wallet not responding
        break
      case 'PUBLISH_TIMEOUT':
        // Relay not acknowledging
        break
    }
  }
}
```
