import { bytesToHex } from '@noble/hashes/utils'
import { schnorr } from '@noble/curves/secp256k1'

import { finalizeEvent, type EventTemplate, type VerifiedEvent } from './event.js'
import * as nip04 from './nip04.js'

export type RelayMap = Record<string, { read: boolean; write: boolean }>

export interface Signer {
  getPublicKey(): Promise<string>
  signEvent(event: EventTemplate): Promise<VerifiedEvent>
  nip04?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>
    decrypt(pubkey: string, ciphertext: string): Promise<string>
  }
  getRelays?(): Promise<RelayMap>
}

export function createSecretKeySigner(secretKey: Uint8Array): Signer {
  const pubkey = bytesToHex(schnorr.getPublicKey(secretKey))

  return {
    async getPublicKey() {
      return pubkey
    },

    async signEvent(event: EventTemplate) {
      return finalizeEvent(event, secretKey)
    },

    nip04: {
      async encrypt(pubkey: string, plaintext: string) {
        return nip04.encrypt(secretKey, pubkey, plaintext)
      },
      async decrypt(pubkey: string, ciphertext: string) {
        return nip04.decrypt(secretKey, pubkey, ciphertext)
      },
    },
  }
}
