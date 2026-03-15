# NIP-28

Public Chat - defines channel-based public chat using kind 40 (channel creation), kind 41 (channel metadata), kind 42 (channel messages), kind 43 (hide message), and kind 44 (mute user).

## Import

```ts
import { nip28 } from 'nostr-core'
// or import individual functions
import {
  createChannelEventTemplate,
  createChannelEvent,
  createChannelMetadataEventTemplate,
  createChannelMetadataEvent,
  createChannelMessageEventTemplate,
  createChannelMessageEvent,
  createChannelHideMessageEventTemplate,
  createChannelMuteUserEventTemplate,
  parseChannelMetadata,
  parseChannelMessage,
} from 'nostr-core'
```

## ChannelMetadata Type

```ts
type ChannelMetadata = {
  name: string
  about?: string
  picture?: string
}
```

## nip28.createChannelEvent

```ts
function createChannelEvent(metadata: ChannelMetadata, secretKey: Uint8Array): NostrEvent
```

Creates and signs a kind 40 channel creation event.

```ts
const channel = nip28.createChannelEvent(
  { name: 'General', about: 'General discussion', picture: 'https://example.com/pic.png' },
  secretKey,
)
const channelId = channel.id // Use this to reference the channel
```

## nip28.createChannelMetadataEvent

```ts
function createChannelMetadataEvent(channelId: string, metadata: ChannelMetadata, secretKey: Uint8Array, recommendedRelay?: string): NostrEvent
```

Creates a kind 41 channel metadata update event. Only the channel creator should update metadata.

```ts
const update = nip28.createChannelMetadataEvent(
  channelId,
  { name: 'Updated Name', about: 'New description' },
  secretKey,
)
```

## nip28.createChannelMessageEvent

```ts
function createChannelMessageEvent(channelId: string, content: string, secretKey: Uint8Array, recommendedRelay?: string, replyTo?: string): NostrEvent
```

Creates a kind 42 channel message. Optionally replies to another message.

```ts
const msg = nip28.createChannelMessageEvent(channelId, 'Hello everyone!', secretKey)

// Reply to a message
const reply = nip28.createChannelMessageEvent(channelId, 'Great point!', secretKey, undefined, msg.id)
```

## nip28.createChannelHideMessageEventTemplate

```ts
function createChannelHideMessageEventTemplate(messageId: string, reason?: string): EventTemplate
```

Creates a kind 43 event to hide a channel message (moderation).

## nip28.createChannelMuteUserEventTemplate

```ts
function createChannelMuteUserEventTemplate(pubkey: string, reason?: string): EventTemplate
```

Creates a kind 44 event to mute a user in a channel (moderation).

## nip28.parseChannelMetadata

```ts
function parseChannelMetadata(event: NostrEvent): ChannelMetadata
```

Parses channel metadata from a kind 40 or 41 event.

## nip28.parseChannelMessage

```ts
function parseChannelMessage(event: NostrEvent): { channelId?: string; content: string; replyTo?: string }
```

Parses a kind 42 channel message event.

## How It Works

- **Kind 40** creates a channel - the event ID becomes the channel ID
- **Kind 41** updates channel metadata - must reference the channel via `e` tag
- **Kind 42** sends a message - references the channel as `root` and optionally a message as `reply`
- **Kind 43** hides a message (moderator action)
- **Kind 44** mutes a user (moderator action)
- Channel metadata is stored as JSON in the content field
- Messages use NIP-10 style `e` tag markers (root/reply)
