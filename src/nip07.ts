import type { EventTemplate, VerifiedEvent } from './event.js'
import type { Signer, RelayMap } from './signer.js'

// Error classes

export class Nip07Error extends Error {
  code: string
  constructor(message: string, code = 'NIP07_ERROR') {
    super(message)
    this.name = 'Nip07Error'
    this.code = code
  }
}

export class Nip07NotAvailableError extends Nip07Error {
  constructor(message = 'NIP-07 extension not available (window.nostr is undefined)') {
    super(message, 'NIP07_NOT_AVAILABLE')
    this.name = 'Nip07NotAvailableError'
  }
}

// NIP-07 extension interface - shape of window.nostr

export interface Nip07Extension {
  getPublicKey(): Promise<string>
  signEvent(event: EventTemplate): Promise<VerifiedEvent>
  nip04?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>
    decrypt(pubkey: string, ciphertext: string): Promise<string>
  }
  getRelays?(): Promise<RelayMap>
}

// Global augmentation for window.nostr

declare global {
  interface Window {
    nostr?: Nip07Extension
  }
}

// Helpers

export function getExtension(): Nip07Extension {
  if (typeof window === 'undefined' || !window.nostr) {
    throw new Nip07NotAvailableError()
  }
  return window.nostr
}

// Signer implementation

export class Nip07Signer implements Signer {
  private ext: Nip07Extension

  constructor() {
    this.ext = getExtension()
  }

  async getPublicKey(): Promise<string> {
    try {
      return await this.ext.getPublicKey()
    } catch (err) {
      throw new Nip07Error(`getPublicKey failed: ${(err as Error).message}`)
    }
  }

  async signEvent(event: EventTemplate): Promise<VerifiedEvent> {
    try {
      return await this.ext.signEvent(event)
    } catch (err) {
      throw new Nip07Error(`signEvent failed: ${(err as Error).message}`)
    }
  }

  nip04 = {
    encrypt: async (pubkey: string, plaintext: string): Promise<string> => {
      const nip04 = this.ext.nip04
      if (!nip04) throw new Nip07Error('Extension does not support NIP-04', 'NIP07_NIP04_UNSUPPORTED')
      try {
        return await nip04.encrypt(pubkey, plaintext)
      } catch (err) {
        throw new Nip07Error(`nip04.encrypt failed: ${(err as Error).message}`)
      }
    },

    decrypt: async (pubkey: string, ciphertext: string): Promise<string> => {
      const nip04 = this.ext.nip04
      if (!nip04) throw new Nip07Error('Extension does not support NIP-04', 'NIP07_NIP04_UNSUPPORTED')
      try {
        return await nip04.decrypt(pubkey, ciphertext)
      } catch (err) {
        throw new Nip07Error(`nip04.decrypt failed: ${(err as Error).message}`)
      }
    },
  }

  async getRelays(): Promise<RelayMap> {
    if (!this.ext.getRelays) {
      throw new Nip07Error('Extension does not support getRelays', 'NIP07_RELAYS_UNSUPPORTED')
    }
    try {
      return await this.ext.getRelays()
    } catch (err) {
      throw new Nip07Error(`getRelays failed: ${(err as Error).message}`)
    }
  }
}
