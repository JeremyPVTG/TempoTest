export type AsyncStorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export class AsyncStorageDriver {
  constructor(
    private storage: AsyncStorageLike, 
    private key = "habituals.queue"
  ) {}

  async read(): Promise<{ ops: unknown[] }> {
    try {
      const raw = await this.storage.getItem(this.key);
      return raw ? JSON.parse(raw) : { ops: [] };
    } catch {
      return { ops: [] };
    }
  }

  async write(state: unknown): Promise<void> {
    await this.storage.setItem(this.key, JSON.stringify(state));
  }

  async clear(): Promise<void> {
    await this.storage.removeItem(this.key);
  }
}