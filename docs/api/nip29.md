# NIP-29

Relay-based Groups - defines group chat messaging (kind 9) and admin actions (kinds 9000-9005) managed entirely by relays, along with group metadata (kind 39000), admin lists (kind 39001), and member lists (kind 39002).

## Import

```ts
import { nip29 } from 'nostr-core'
// or import individual functions
import {
  createGroupChatTemplate,
  createGroupChatEvent,
  createGroupAdminTemplate,
  parseGroupMetadata,
  parseGroupMembers,
  parseGroupAdmins,
} from 'nostr-core'
```

## GroupMetadata Type

```ts
type GroupMetadata = {
  id: string
  name?: string
  about?: string
  picture?: string
  isOpen?: boolean
  isPublic?: boolean
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Group identifier (`d` tag value) |
| `name` | `string` (optional) | Group name |
| `about` | `string` (optional) | Group description |
| `picture` | `string` (optional) | Group avatar URL |
| `isOpen` | `boolean` (optional) | Whether anyone can join (`true`) or membership is invite-only (`false`) |
| `isPublic` | `boolean` (optional) | Whether messages are public (`true`) or private (`false`) |

## GroupAdminAction Type

```ts
type GroupAdminAction =
  | { type: 'add-user'; pubkey: string }
  | { type: 'remove-user'; pubkey: string }
  | { type: 'edit-metadata'; name?: string; about?: string; picture?: string }
  | { type: 'delete-event'; eventId: string }
  | { type: 'add-permission'; pubkey: string; permission: string }
  | { type: 'remove-permission'; pubkey: string; permission: string }
```

| Variant | Kind | Fields | Description |
|---------|------|--------|-------------|
| `'add-user'` | 9000 | `pubkey` | Invite a user to the group |
| `'remove-user'` | 9001 | `pubkey` | Remove a user from the group |
| `'edit-metadata'` | 9002 | `name?`, `about?`, `picture?` | Edit group metadata |
| `'delete-event'` | 9005 | `eventId` | Delete a message in the group |
| `'add-permission'` | 9003 | `pubkey`, `permission` | Grant a permission to a user |
| `'remove-permission'` | 9004 | `pubkey`, `permission` | Revoke a permission from a user |

## nip29.createGroupChatTemplate

```ts
function createGroupChatTemplate(groupId: string, content: string, replyTo?: string): EventTemplate
```

Creates an unsigned kind 9 group chat message event template.

| Parameter | Type | Description |
|-----------|------|-------------|
| `groupId` | `string` | Group identifier (`h` tag value) |
| `content` | `string` | Message text |
| `replyTo` | `string` (optional) | Event ID of the message being replied to |

**Returns:** `EventTemplate` - Unsigned kind 9 event with `h` tag and optional `e` reply tag.

```ts
const template = nip29.createGroupChatTemplate('my-group', 'Hello everyone!')
const signed = await signer.signEvent(template)
```

## nip29.createGroupChatEvent

```ts
function createGroupChatEvent(groupId: string, content: string, secretKey: Uint8Array, replyTo?: string): NostrEvent
```

Creates and signs a kind 9 group chat message event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `groupId` | `string` | Group identifier |
| `content` | `string` | Message text |
| `secretKey` | `Uint8Array` | Signer's secret key (32 bytes) |
| `replyTo` | `string` (optional) | Event ID being replied to |

**Returns:** `NostrEvent` - Signed kind 9 event ready to publish.

```ts
const msg = nip29.createGroupChatEvent('my-group', 'Hello!', secretKey)
await relay.publish(msg)

// Reply to a message
const reply = nip29.createGroupChatEvent('my-group', 'Hi back!', secretKey, msg.id)
await relay.publish(reply)
```

## nip29.createGroupAdminTemplate

```ts
function createGroupAdminTemplate(groupId: string, action: GroupAdminAction): EventTemplate
```

Creates a group admin action event template. The kind is determined by the action type.

| Parameter | Type | Description |
|-----------|------|-------------|
| `groupId` | `string` | Group identifier |
| `action` | `GroupAdminAction` | Admin action to perform |

**Returns:** `EventTemplate` - Unsigned admin event (kind 9000-9005) with appropriate tags.

```ts
// Add a user to the group
const addUser = nip29.createGroupAdminTemplate('my-group', {
  type: 'add-user',
  pubkey: 'user-pubkey-hex',
})

// Edit group metadata
const editMeta = nip29.createGroupAdminTemplate('my-group', {
  type: 'edit-metadata',
  name: 'New Group Name',
  about: 'Updated description',
})

// Grant moderator permission
const addPerm = nip29.createGroupAdminTemplate('my-group', {
  type: 'add-permission',
  pubkey: 'mod-pubkey',
  permission: 'delete-event',
})
```

## nip29.parseGroupMetadata

```ts
function parseGroupMetadata(event: NostrEvent): GroupMetadata
```

Parses a kind 39000 group metadata event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NostrEvent` | A kind 39000 group metadata event |

**Returns:** `GroupMetadata` - Parsed group metadata.

```ts
const metadata = nip29.parseGroupMetadata(metadataEvent)
console.log(metadata)
// {
//   id: 'my-group',
//   name: 'Nostr Developers',
//   about: 'A group for Nostr devs',
//   picture: 'https://example.com/group.jpg',
//   isOpen: true,
//   isPublic: true
// }
```

## nip29.parseGroupMembers

```ts
function parseGroupMembers(event: NostrEvent): string[]
```

Parses a kind 39002 group members event into a list of pubkeys.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NostrEvent` | A kind 39002 group members event |

**Returns:** `string[]` - Array of member pubkeys.

```ts
const members = nip29.parseGroupMembers(membersEvent)
console.log(members) // ['pubkey1', 'pubkey2', 'pubkey3']
```

## nip29.parseGroupAdmins

```ts
function parseGroupAdmins(event: NostrEvent): Array<{ pubkey: string; permissions: string[] }>
```

Parses a kind 39001 group admins event into a list of admins with their permissions.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NostrEvent` | A kind 39001 group admins event |

**Returns:** `Array<{ pubkey: string; permissions: string[] }>` - Array of admin entries.

```ts
const admins = nip29.parseGroupAdmins(adminsEvent)
console.log(admins)
// [
//   { pubkey: 'admin1-pubkey', permissions: ['add-user', 'remove-user', 'edit-metadata'] },
//   { pubkey: 'mod1-pubkey', permissions: ['delete-event'] },
// ]
```

## Full Example

```ts
import { generateSecretKey, getPublicKey, finalizeEvent, nip29, Relay } from 'nostr-core'

const sk = generateSecretKey()
const pk = getPublicKey(sk)
const relay = new Relay('wss://groups.example.com')
await relay.connect()

// Send a message to a group
const msg = nip29.createGroupChatEvent('dev-chat', 'Hello everyone!', sk)
await relay.publish(msg)

// Reply to the message
const reply = nip29.createGroupChatEvent('dev-chat', 'Welcome!', sk, msg.id)
await relay.publish(reply)

// Admin: add a new user
const addUser = nip29.createGroupAdminTemplate('dev-chat', {
  type: 'add-user',
  pubkey: 'new-member-pubkey',
})
const adminEvent = finalizeEvent(addUser, sk)
await relay.publish(adminEvent)

// Admin: update group info
const editMeta = nip29.createGroupAdminTemplate('dev-chat', {
  type: 'edit-metadata',
  name: 'Nostr Dev Chat',
  about: 'Discussion about Nostr development',
})
const metaEvent = finalizeEvent(editMeta, sk)
await relay.publish(metaEvent)

// Fetch group info
const sub = relay.subscribe(
  [{ kinds: [39000, 39001, 39002], '#d': ['dev-chat'] }],
  {
    onevent(event) {
      if (event.kind === 39000) {
        const metadata = nip29.parseGroupMetadata(event)
        console.log(`Group: ${metadata.name} - ${metadata.about}`)
        console.log(`Open: ${metadata.isOpen}, Public: ${metadata.isPublic}`)
      } else if (event.kind === 39001) {
        const admins = nip29.parseGroupAdmins(event)
        console.log(`Admins: ${admins.length}`)
      } else if (event.kind === 39002) {
        const members = nip29.parseGroupMembers(event)
        console.log(`Members: ${members.length}`)
      }
    },
  },
)

relay.close()
```

## How It Works

- Groups are hosted and managed by specific relays, not the protocol at large
- **Kind 9** is used for group chat messages; the `h` tag identifies the group
- **Kinds 9000-9005** are admin actions that the relay processes and enforces
- **Kind 39000** is a replaceable event from the relay containing group metadata
- **Kind 39001** is a replaceable event listing group admins and their permissions
- **Kind 39002** is a replaceable event listing group members
- The relay is the authority - it validates permissions and rejects unauthorized actions
- Groups can be `open` (anyone can join) or `closed` (invite-only)
- Groups can be `public` (messages visible to all) or `private` (members only)
- Messages reference the group via the `h` tag and can thread via `e` tags with a `reply` marker
- Admin permissions include: `add-user`, `remove-user`, `edit-metadata`, `delete-event`, `add-permission`, `remove-permission`
