# NIP-98

HTTP Auth - authenticates HTTP requests using kind 27235 Nostr events. The client signs an event containing the request URL, method, and optional body hash, then sends it as a base64-encoded `Authorization: Nostr <base64>` header.

## Import

```ts
import { nip98 } from 'nostr-core'
// or import individual functions
import {
  createHttpAuthEventTemplate,
  createHttpAuthEvent,
  getAuthorizationHeader,
  verifyHttpAuthEvent,
} from 'nostr-core'
```

## HttpAuthOptions Type

```ts
type HttpAuthOptions = {
  url: string
  method: string
  body?: Uint8Array | string
}
```

| Field | Type | Description |
|-------|------|-------------|
| `url` | `string` | Full URL of the HTTP request |
| `method` | `string` | HTTP method (GET, POST, PUT, DELETE, etc.) |
| `body` | `Uint8Array \| string` (optional) | Request body (used to compute SHA-256 payload hash) |

## nip98.createHttpAuthEventTemplate

```ts
function createHttpAuthEventTemplate(opts: HttpAuthOptions): EventTemplate
```

Creates an unsigned kind 27235 HTTP auth event template. If a body is provided, its SHA-256 hash is included as a `payload` tag.

| Parameter | Type | Description |
|-----------|------|-------------|
| `opts` | `HttpAuthOptions` | URL, method, and optional body |

**Returns:** `EventTemplate` - Unsigned kind 27235 event with `u`, `method`, and optional `payload` tags.

```ts
const template = nip98.createHttpAuthEventTemplate({
  url: 'https://api.example.com/upload',
  method: 'POST',
  body: fileBytes,
})

const signed = await signer.signEvent(template)
```

## nip98.createHttpAuthEvent

```ts
function createHttpAuthEvent(opts: HttpAuthOptions, secretKey: Uint8Array): NostrEvent
```

Creates and signs a kind 27235 HTTP auth event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `opts` | `HttpAuthOptions` | URL, method, and optional body |
| `secretKey` | `Uint8Array` | Signer's secret key (32 bytes) |

**Returns:** `NostrEvent` - Signed kind 27235 auth event.

```ts
const authEvent = nip98.createHttpAuthEvent(
  { url: 'https://api.example.com/upload', method: 'POST', body: fileBytes },
  secretKey,
)
```

## nip98.getAuthorizationHeader

```ts
function getAuthorizationHeader(event: NostrEvent): string
```

Converts a signed HTTP auth event into the `Authorization` header value in `Nostr <base64>` format.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NostrEvent` | Signed kind 27235 auth event |

**Returns:** `string` - Authorization header value (e.g., `'Nostr eyJraW5kI...'`).

```ts
const authEvent = nip98.createHttpAuthEvent(
  { url: 'https://api.example.com/data', method: 'GET' },
  secretKey,
)

const header = nip98.getAuthorizationHeader(authEvent)
console.log(header) // 'Nostr eyJraW5kIjoyNzIzNS...'

const response = await fetch('https://api.example.com/data', {
  headers: { Authorization: header },
})
```

## nip98.verifyHttpAuthEvent

```ts
function verifyHttpAuthEvent(event: NostrEvent, opts: HttpAuthOptions): boolean
```

Verifies an HTTP auth event against the expected request parameters. Checks the event kind, signature, timestamp (within 60 seconds), URL, method, and body hash.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NostrEvent` | The auth event to verify |
| `opts` | `HttpAuthOptions` | Expected URL, method, and optional body |

**Returns:** `boolean` - `true` if the event is valid and matches the request.

```ts
const isValid = nip98.verifyHttpAuthEvent(authEvent, {
  url: 'https://api.example.com/upload',
  method: 'POST',
  body: requestBody,
})

if (isValid) {
  console.log(`Authenticated request from ${authEvent.pubkey}`)
}
```

## Full Example

```ts
import { generateSecretKey, getPublicKey, nip98 } from 'nostr-core'

const sk = generateSecretKey()
const pk = getPublicKey(sk)

// Client-side: Authenticate a GET request
const getAuth = nip98.createHttpAuthEvent(
  { url: 'https://api.example.com/profile', method: 'GET' },
  sk,
)

const response = await fetch('https://api.example.com/profile', {
  headers: { Authorization: nip98.getAuthorizationHeader(getAuth) },
})

// Client-side: Authenticate a POST request with body
const body = JSON.stringify({ name: 'Alice', about: 'Nostr user' })
const postAuth = nip98.createHttpAuthEvent(
  { url: 'https://api.example.com/profile', method: 'POST', body },
  sk,
)

const postResponse = await fetch('https://api.example.com/profile', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: nip98.getAuthorizationHeader(postAuth),
  },
  body,
})

// Server-side: Verify an incoming request
function handleRequest(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Nostr ')) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Decode the base64 event from the header
  const base64 = authHeader.slice(6)
  const json = new TextDecoder().decode(Uint8Array.from(atob(base64), c => c.charCodeAt(0)))
  const event = JSON.parse(json)

  const isValid = nip98.verifyHttpAuthEvent(event, {
    url: req.url,
    method: req.method,
    body: req.body ? await req.text() : undefined,
  })

  if (!isValid) {
    return new Response('Invalid auth', { status: 403 })
  }

  console.log(`Authenticated: ${event.pubkey}`)
  return new Response('OK')
}
```

## How It Works

- **Kind 27235** events authenticate HTTP requests using Nostr key pairs
- The `u` tag contains the full request URL
- The `method` tag contains the HTTP method in uppercase
- The `payload` tag contains the SHA-256 hash of the request body (if present)
- The signed event is base64-encoded and sent as `Authorization: Nostr <base64>`
- **Verification checks:** valid signature, kind 27235, timestamp within 60 seconds, matching URL, matching method, matching body hash
- The 60-second timestamp window prevents replay attacks with old auth events
- Each HTTP request requires a fresh auth event (cannot reuse across requests)
- This is commonly used by media upload servers, API endpoints, and blossom servers
- The body hash ensures the auth event is bound to the specific request payload
