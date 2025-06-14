export class AdvancedCache {
  constructor(maxSize = 5000, defaultTTL = 300000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return undefined;
    }

    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    this.stats.hits++;
    return item.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expires: ttl ? Date.now() + ttl : null,
      created: Date.now()
    });

    this.stats.sets++;
  }

  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) this.stats.deletes++;
    return deleted;
  }

  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.expires && now > item.expires) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  stats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      active: this.cache.size,
      total: this.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      hitRate: total > 0 ? this.stats.hits / total : 0
    };
  }
}