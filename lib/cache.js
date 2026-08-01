// A tiny in-memory TTL cache to avoid repeat requests for the same data.
export class TTLCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttlMs) {
    this.store.set(key, { value, expires: Date.now() + ttlMs });
  }

  // Wrap an async producer: return cached value if fresh, else produce + cache.
  async wrap(key, ttlMs, producer) {
    const cached = this.get(key);
    if (cached !== undefined) return { value: cached, cached: true };
    const value = await producer();
    this.set(key, value, ttlMs);
    return { value, cached: false };
  }
}
