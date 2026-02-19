# Installation

## Package Manager

::: code-group

```sh [npm]
npm install nostr-core
```

```sh [pnpm]
pnpm add nostr-core
```

```sh [yarn]
yarn add nostr-core
```

:::

## Requirements

- **Node.js 18+** or any runtime with Web Crypto and WebSocket support (Deno, Bun, Cloudflare Workers)
- **ESM only** - nostr-core ships as an ES module. Your project must use `"type": "module"` in `package.json` or use `.mjs` file extensions.

## Dependencies

nostr-core has four runtime dependencies, all from the audited [noble](https://paulmillr.com/noble/) / [scure](https://github.com/paulmillr/scure-base) family:

| Package | Purpose |
|---------|---------|
| `@noble/curves` | secp256k1 / schnorr signatures |
| `@noble/hashes` | SHA-256, HMAC, HKDF |
| `@noble/ciphers` | AES-CBC, ChaCha20 |
| `@scure/base` | Base64, bech32 encoding |

No framework dependencies. No native addons.

## Verify Installation

```ts
import { NWC, generateSecretKey, getPublicKey } from 'nostr-core'

const sk = generateSecretKey()
console.log('Public key:', getPublicKey(sk))
```

If the above prints a 64-character hex string, you're ready to go.
