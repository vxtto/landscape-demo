type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class TtlCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private readonly inFlight = new Map<string, Promise<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number,
  ) {}

  async getOrLoad(key: string, loader: () => Promise<T>) {
    const cached = this.entries.get(key);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      this.entries.delete(key);
      this.entries.set(key, cached);
      return { value: cached.value, cacheStatus: "hit" as const };
    }

    if (cached) this.entries.delete(key);

    const existingLoad = this.inFlight.get(key);
    if (existingLoad) {
      return {
        value: await existingLoad,
        cacheStatus: "coalesced" as const,
      };
    }

    const load = loader();
    this.inFlight.set(key, load);

    try {
      const value = await load;
      this.entries.set(key, {
        value,
        expiresAt: Date.now() + this.ttlMs,
      });
      this.evictOverflow();
      return { value, cacheStatus: "miss" as const };
    } finally {
      this.inFlight.delete(key);
    }
  }

  private evictOverflow() {
    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey === undefined) return;
      this.entries.delete(oldestKey);
    }
  }
}
