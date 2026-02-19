// Main API
export { NWC } from './nwc.js'

// Types
export type {
  EncryptionType,
  Nip47Method,
  Nip47NotificationType,
  GetInfoResponse,
  GetBalanceResponse,
  GetBudgetResponse,
  PayResponse,
  Transaction,
  MakeInvoiceRequest,
  PayInvoiceRequest,
  PayKeysendRequest,
  LookupInvoiceRequest,
  ListTransactionsRequest,
  ListTransactionsResponse,
  SignMessageRequest,
  SignMessageResponse,
  Nip47Notification,
  NWCConnectionOptions,
  LightningAddressResponse,
  FiatRate,
  FiatConversion,
} from './types.js'

// Error classes
export {
  NWCError,
  NWCWalletError,
  NWCTimeoutError,
  NWCPublishTimeoutError,
  NWCReplyTimeoutError,
  NWCPublishError,
  NWCConnectionError,
  NWCDecryptionError,
  LightningAddressError,
  FiatConversionError,
} from './types.js'

// Lightning Address
export { fetchInvoice, validateLightningAddress, parseLightningAddress } from './lightning-address.js'

// Fiat Conversion
export { getExchangeRate, fiatToSats, satsToFiat } from './fiat.js'

// Crypto
export { generateSecretKey, getPublicKey } from './crypto.js'

// Event system
export { finalizeEvent, verifyEvent, getEventHash, serializeEvent, validateEvent, verifiedSymbol } from './event.js'
export type { NostrEvent, EventTemplate, UnsignedEvent, VerifiedEvent } from './event.js'

// Filters
export { matchFilter, matchFilters } from './filter.js'
export type { Filter } from './filter.js'

// NIPs
export * as nip04 from './nip04.js'
export * as nip44 from './nip44.js'
export * as nip19 from './nip19.js'

// Networking
export { Relay, Subscription } from './relay.js'
export type { SubscriptionParams } from './relay.js'
export { RelayPool } from './pool.js'
export type { SubCloser, PoolSubscribeParams } from './pool.js'

// Utils
export { normalizeURL, utf8Encoder, utf8Decoder, bytesToHex, hexToBytes, randomBytes } from './utils.js'
