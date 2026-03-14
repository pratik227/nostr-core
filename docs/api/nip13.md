# NIP-13

Proof of Work - defines a scheme for generating and verifying proof-of-work on Nostr events using leading zero bits in the event ID. Events commit to a target difficulty via a `nonce` tag.

## Import

```ts
import { nip13 } from 'nostr-core'
// or import individual functions
import {
  countLeadingZeroBits,
  getPowDifficulty,
  getTargetDifficulty,
  verifyPow,
  minePow,
} from 'nostr-core'
```

## nip13.countLeadingZeroBits

```ts
function countLeadingZeroBits(hex: string): number
```

Counts the number of leading zero bits in a hex string.

```ts
nip13.countLeadingZeroBits('000000abc...') // 20
```

## nip13.getPowDifficulty

```ts
function getPowDifficulty(event: NostrEvent): number
```

Gets the proof-of-work difficulty of an event (leading zero bits of the event ID).

```ts
const difficulty = nip13.getPowDifficulty(event)
console.log(`Event has ${difficulty} bits of work`)
```

## nip13.getTargetDifficulty

```ts
function getTargetDifficulty(event: NostrEvent | EventTemplate): number
```

Gets the target difficulty committed to by the nonce tag. Returns 0 if no nonce tag with target.

```ts
const target = nip13.getTargetDifficulty(event) // e.g. 21
```

## nip13.verifyPow

```ts
function verifyPow(event: NostrEvent, minDifficulty: number): boolean
```

Verifies an event meets a minimum proof-of-work difficulty. Checks both the actual difficulty and the committed target.

```ts
const isValid = nip13.verifyPow(event, 20)
```

## nip13.minePow

```ts
function minePow(template: EventTemplate, targetDifficulty: number): EventTemplate
```

Mines proof-of-work for an event template by incrementing a nonce until the target difficulty is reached. **WARNING:** CPU-intensive for high difficulties.

```ts
const mined = nip13.minePow(template, 16)
const event = finalizeEvent(mined, secretKey)
```

## How It Works

- Difficulty is measured as the number of leading zero bits in the event ID (hex)
- The `nonce` tag format is `['nonce', counter, target_difficulty]`
- The committed target difficulty prevents miners from publishing events that accidentally have high difficulty
- `verifyPow` checks both actual difficulty >= min AND committed target >= min
- Higher difficulty = more computational work = spam deterrence
- Typical values: 8-16 bits for light PoW, 20+ for stronger requirements
