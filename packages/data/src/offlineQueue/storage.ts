import type { QueueSnapshot } from './types'

export interface StorageDriver {
  read(): Promise<QueueSnapshot>
  write(s: QueueSnapshot): Promise<void>
  clear(): Promise<void>
}

export class WebLocalStorageDriver implements StorageDriver {
  private key = 'habituals.queue'
  async read(): Promise<QueueSnapshot> {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(this.key) : null
      return raw ? (JSON.parse(raw) as QueueSnapshot) : { ops: [] }
    } catch {
      return { ops: [] }
    }
  }
  async write(s: QueueSnapshot): Promise<void> {
    if (typeof localStorage !== 'undefined') localStorage.setItem(this.key, JSON.stringify(s))
  }
  async clear(): Promise<void> {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(this.key)
  }
}


