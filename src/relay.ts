import type { NostrEvent } from './event.js'
import { verifyEvent } from './event.js'
import { matchFilters, type Filter } from './filter.js'
import { normalizeURL } from './utils.js'

export type SubscriptionParams = {
  onevent?: (evt: NostrEvent) => void
  oneose?: () => void
  onclose?: (reason: string) => void
  eoseTimeout?: number
}

export class Subscription {
  public readonly relay: Relay
  public readonly id: string
  public closed = false
  public eosed = false
  public filters: Filter[]

  public onevent: (evt: NostrEvent) => void
  public oneose: (() => void) | undefined
  public onclose: ((reason: string) => void) | undefined

  private eoseTimeoutHandle: ReturnType<typeof setTimeout> | undefined

  constructor(relay: Relay, id: string, filters: Filter[], params: SubscriptionParams) {
    this.relay = relay
    this.filters = filters
    this.id = id
    this.onevent = params.onevent || (() => {})
    this.oneose = params.oneose
    this.onclose = params.onclose
  }

  fire() {
    this.relay.send('["REQ","' + this.id + '",' + JSON.stringify(this.filters).substring(1))
    this.eoseTimeoutHandle = setTimeout(() => this.receivedEose(), this.relay.eoseTimeout)
  }

  receivedEose() {
    if (this.eosed) return
    clearTimeout(this.eoseTimeoutHandle)
    this.eosed = true
    this.oneose?.()
  }

  close(reason = 'closed by caller') {
    if (!this.closed && this.relay.connected) {
      try {
        this.relay.send('["CLOSE",' + JSON.stringify(this.id) + ']')
      } catch {
        // ignore send errors on close
      }
      this.closed = true
    }
    this.relay.openSubs.delete(this.id)
    this.onclose?.(reason)
  }
}

export class Relay {
  public readonly url: string
  private _connected = false
  public eoseTimeout = 4400
  public publishTimeout = 4400
  public openSubs = new Map<string, Subscription>()

  private connectionPromise: Promise<void> | undefined
  private openEventPublishes = new Map<string, {
    resolve: (reason: string) => void
    reject: (err: Error) => void
    timeout: ReturnType<typeof setTimeout>
  }>()
  private ws: WebSocket | undefined
  private serial = 0
  private _WebSocket: typeof WebSocket

  constructor(url: string, opts?: { websocketImplementation?: typeof WebSocket }) {
    this.url = normalizeURL(url)
    this._WebSocket = opts?.websocketImplementation || WebSocket
  }

  get connected(): boolean {
    return this._connected
  }

  async connect(opts?: { timeout?: number }): Promise<void> {
    if (this.connectionPromise) return this.connectionPromise

    this.connectionPromise = new Promise((resolve, reject) => {
      let connectionTimeoutHandle: ReturnType<typeof setTimeout> | undefined

      if (opts?.timeout) {
        connectionTimeoutHandle = setTimeout(() => {
          reject(new Error('connection timed out'))
          this.connectionPromise = undefined
        }, opts.timeout)
      }

      try {
        this.ws = new this._WebSocket(this.url)
      } catch (err) {
        clearTimeout(connectionTimeoutHandle)
        reject(err)
        return
      }

      this.ws.onopen = () => {
        clearTimeout(connectionTimeoutHandle)
        this._connected = true
        resolve()
      }

      this.ws.onerror = () => {
        clearTimeout(connectionTimeoutHandle)
        reject(new Error('connection failed'))
        this.connectionPromise = undefined
      }

      this.ws.onclose = () => {
        clearTimeout(connectionTimeoutHandle)
        this._connected = false
        this.connectionPromise = undefined
        this.closeAllSubscriptions('relay connection closed')
      }

      this.ws.onmessage = this._onmessage.bind(this)
    })

    return this.connectionPromise
  }

  send(message: string) {
    if (!this._connected || !this.ws) throw new Error(`not connected to ${this.url}`)
    this.ws.send(message)
  }

  async publish(event: NostrEvent): Promise<string> {
    const ret = new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        const ep = this.openEventPublishes.get(event.id)
        if (ep) {
          ep.reject(new Error('publish timed out'))
          this.openEventPublishes.delete(event.id)
        }
      }, this.publishTimeout)
      this.openEventPublishes.set(event.id, { resolve, reject, timeout })
    })
    this.send('["EVENT",' + JSON.stringify(event) + ']')
    return ret
  }

  subscribe(filters: Filter[], params: SubscriptionParams & { id?: string }): Subscription {
    this.serial++
    const id = params.id || 'sub:' + this.serial
    const sub = new Subscription(this, id, filters, params)
    this.openSubs.set(id, sub)
    sub.fire()
    return sub
  }

  close() {
    this.closeAllSubscriptions('relay connection closed by us')
    this._connected = false
    this.connectionPromise = undefined
    if (this.ws?.readyState === this._WebSocket.OPEN) {
      this.ws?.close()
    }
  }

  private closeAllSubscriptions(reason: string) {
    for (const [_, sub] of this.openSubs) {
      sub.close(reason)
    }
    this.openSubs.clear()

    for (const [_, ep] of this.openEventPublishes) {
      ep.reject(new Error(reason))
    }
    this.openEventPublishes.clear()
  }

  _onmessage(ev: MessageEvent): void {
    let data: unknown[]
    try {
      data = JSON.parse(ev.data)
    } catch {
      return
    }

    switch (data[0]) {
      case 'EVENT': {
        const so = this.openSubs.get(data[1] as string)
        if (!so) return
        const event = data[2] as NostrEvent
        if (verifyEvent(event) && matchFilters(so.filters, event)) {
          so.onevent(event)
        }
        return
      }
      case 'EOSE': {
        const so = this.openSubs.get(data[1] as string)
        if (!so) return
        so.receivedEose()
        return
      }
      case 'OK': {
        const id = data[1] as string
        const ok = data[2] as boolean
        const reason = data[3] as string
        const ep = this.openEventPublishes.get(id)
        if (ep) {
          clearTimeout(ep.timeout)
          if (ok) ep.resolve(reason)
          else ep.reject(new Error(reason))
          this.openEventPublishes.delete(id)
        }
        return
      }
      case 'CLOSED': {
        const so = this.openSubs.get(data[1] as string)
        if (!so) return
        so.closed = true
        so.close(data[2] as string)
        return
      }
      case 'NOTICE': {
        return
      }
    }
  }
}
