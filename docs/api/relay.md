# Relay

WebSocket connection to a single Nostr relay.

## Import

```ts
import { Relay } from 'nostr-core'
```

## Constructor

```ts
new Relay(url: string, opts?: {
  websocketImplementation?: typeof WebSocket
})
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | `string` | Relay WebSocket URL |
| `opts.websocketImplementation` | `typeof WebSocket?` | Custom WebSocket class |

The URL is normalized automatically (see [`normalizeURL`](/api/utils#normalizeurl)).

## Properties

### url

```ts
relay.url: string // readonly
```

The normalized relay URL.

### connected

```ts
relay.connected: boolean // getter
```

Whether the WebSocket connection is active.

### eoseTimeout

```ts
relay.eoseTimeout: number // default: 4400
```

Milliseconds to wait for EOSE before timing out a subscription.

### publishTimeout

```ts
relay.publishTimeout: number // default: 4400
```

Milliseconds to wait for OK response after publishing.

### openSubs

```ts
relay.openSubs: Map<string, Subscription>
```

Currently active subscriptions, keyed by subscription ID.

## Methods

### connect

```ts
await relay.connect(opts?: { timeout?: number }): Promise<void>
```

Establishes the WebSocket connection. All subscriptions are closed if the connection drops.

| Parameter | Type | Description |
|-----------|------|-------------|
| `opts.timeout` | `number?` | Connection timeout in ms |

**Throws:** `Error` on connection failure or timeout.

### publish

```ts
await relay.publish(event: NostrEvent): Promise<string>
```

Publishes an event and waits for the relay's OK response.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NostrEvent` | Signed event to publish |

**Returns:** `string` - reason from the relay's OK message.

**Throws:** `Error` on timeout or NACK (negative acknowledgement).

### subscribe

```ts
relay.subscribe(filters: Filter[], params: SubscriptionParams & { id?: string }): Subscription
```

Creates a subscription and immediately starts receiving events.

| Parameter | Type | Description |
|-----------|------|-------------|
| `filters` | `Filter[]` | Array of event filters |
| `params` | `SubscriptionParams` | Callbacks and options |
| `params.id` | `string?` | Custom subscription ID |

**Returns:** `Subscription`

### send

```ts
relay.send(message: string): void
```

Sends a raw message over the WebSocket.

**Throws:** `Error` if not connected.

### close

```ts
relay.close(): void
```

Closes all subscriptions and the WebSocket connection.

---

## Subscription

Represents an active subscription to a relay.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `relay` | `Relay` | Parent relay (readonly) |
| `id` | `string` | Subscription ID (readonly) |
| `closed` | `boolean` | Whether closed |
| `eosed` | `boolean` | Whether EOSE received |
| `filters` | `Filter[]` | Active filters |

### Callbacks

| Callback | Type | Description |
|----------|------|-------------|
| `onevent` | `(evt: NostrEvent) => void` | Called for each matching event |
| `oneose` | `(() => void)?` | Called when stored events are exhausted |
| `onclose` | `((reason: string) => void)?` | Called when subscription closes |

### Methods

#### close

```ts
sub.close(reason?: string): void
```

Sends a CLOSE message to the relay and calls `onclose`.

#### fire

```ts
sub.fire(): void
```

Sends the REQ message to the relay. Called automatically by `relay.subscribe()`.

---

## SubscriptionParams

```ts
type SubscriptionParams = {
  onevent?: (evt: NostrEvent) => void
  oneose?: () => void
  onclose?: (reason: string) => void
  eoseTimeout?: number
}
```
