import { describe, it, expect } from "vitest";
import { AsyncStorageDriver, type AsyncStorageLike } from "../asyncStorageDriver";

function makeStorage(): AsyncStorageLike {
  const map = new Map<string, string>();
  return {
    async getItem(key: string): Promise<string | null> { 
      return map.has(key) ? map.get(key)! : null;
    },
    async setItem(key: string, value: string): Promise<void> { 
      map.set(key, value);
    },
    async removeItem(key: string): Promise<void> { 
      map.delete(key);
    }
  };
}

describe("AsyncStorageDriver", () => {
  it("read() returns empty ops on missing key", async () => {
    const driver = new AsyncStorageDriver(makeStorage());
    const snapshot = await driver.read();
    expect(snapshot).toEqual({ ops: [] });
  });

  it("write() then read() round-trips", async () => {
    const storage = makeStorage();
    const driver = new AsyncStorageDriver(storage);
    
    await driver.write({ 
      ops: [{ 
        kind: "markDone", 
        idempotencyKey: "test-key", 
        input: { habit_id: "1", occurred_at_tz: "2025-01-01T00:00:00Z" } 
      }] 
    });
    
    const snapshot = await driver.read();
    expect(snapshot.ops).toHaveLength(1);
    expect((snapshot.ops[0] as any).kind).toBe("markDone");
  });

  it("read() tolerates JSON parse errors", async () => {
    const storage = makeStorage();
    await storage.setItem("habituals.queue", "{not json");
    
    const driver = new AsyncStorageDriver(storage);
    const snapshot = await driver.read();
    
    expect(snapshot).toEqual({ ops: [] });
  });

  it("clear() removes data", async () => {
    const storage = makeStorage();
    const driver = new AsyncStorageDriver(storage);
    
    await driver.write({ 
      ops: [{ 
        kind: "markDone", 
        idempotencyKey: "test-key", 
        input: {} 
      }] 
    });
    
    await driver.clear();
    const snapshot = await driver.read();
    
    expect(snapshot.ops).toHaveLength(0);
  });

  it("uses custom storage key", async () => {
    const storage = makeStorage();
    const driver = new AsyncStorageDriver(storage, "custom.key");
    
    await driver.write({ ops: [{ kind: "test" }] });
    
    // Check that it's stored under custom key
    const raw = await storage.getItem("custom.key");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toEqual({ ops: [{ kind: "test" }] });
  });

  it("handles storage failures gracefully", async () => {
    const failingStorage: AsyncStorageLike = {
      async getItem(): Promise<string | null> { 
        throw new Error("Storage failed");
      },
      async setItem(): Promise<void> { 
        throw new Error("Storage failed");
      },
      async removeItem(): Promise<void> { 
        throw new Error("Storage failed");
      }
    };

    const driver = new AsyncStorageDriver(failingStorage);
    
    // Read should return empty ops on failure
    const snapshot = await driver.read();
    expect(snapshot).toEqual({ ops: [] });
    
    // Write/clear should not throw (though they may fail silently)
    await expect(driver.write({ ops: [] })).rejects.toThrow();
    await expect(driver.clear()).rejects.toThrow();
  });
});