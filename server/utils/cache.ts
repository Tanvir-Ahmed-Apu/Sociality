// Simple in-memory cache for suggestions
class SuggestionCache {
  private cache: Map<string, any>;
  private ttl: number;

  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes TTL
  }

  // Generate cache key
  generateKey(type, userId) {
    return `${type}_${userId}`;
  }

  // Set cache entry
  set(type, userId, data) {
    const key = this.generateKey(type, userId);
    const entry = {
      data,
      timestamp: Date.now(),
      ttl: this.ttl
    };
    this.cache.set(key, entry);
  }

  // Get cache entry
  get(type, userId) {
    const key = this.generateKey(type, userId);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Clear cache for a specific user
  clearUser(userId: string) {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.endsWith(`_${userId}`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Clear all cache
  clear() {
    this.cache.clear();
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }
}

// Create singleton instance
const suggestionCache = new SuggestionCache();

// Cleanup expired entries every 10 minutes
setInterval(() => {
  suggestionCache.cleanup();
}, 10 * 60 * 1000);

export default suggestionCache;
