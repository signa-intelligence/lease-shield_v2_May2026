/**
 * Offline Cache Utilities
 * Provides intelligent caching for offline mode
 */

const CACHE_PREFIX = 'leaseshield_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save data to cache
 */
export const saveToCache = async (key, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      version: '1.0'
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
    return true;
  } catch (error) {
    console.warn('Failed to save to cache:', error);
    return false;
  }
};

/**
 * Get data from cache
 */
export const getFromCache = (key, maxAge = CACHE_EXPIRY) => {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    // Return null if expired
    if (age > maxAge) {
      clearCache(key);
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Failed to read from cache:', error);
    return null;
  }
};

/**
 * Clear specific cache
 */
export const clearCache = (key) => {
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
};

/**
 * Clear all caches
 */
export const clearAllCaches = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('✅ All caches cleared');
  } catch (error) {
    console.warn('Failed to clear all caches:', error);
  }
};

/**
 * Get cache size
 */
export const getCacheSize = () => {
  try {
    let total = 0;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        total += localStorage.getItem(key)?.length || 0;
      }
    });
    return (total / 1024).toFixed(2); // KB
  } catch (error) {
    return 0;
  }
};

/**
 * Cache decorator for React Query
 */
export const withOfflineCache = (queryKey, queryFn, options = {}) => {
  return {
    queryKey,
    queryFn: async (...args) => {
      // Try to fetch from network
      try {
        const data = await queryFn(...args);
        
        // Save to cache on success
        if (data) {
          await saveToCache(queryKey.join('_'), data);
        }
        
        return data;
      } catch (error) {
        // If offline, try cache
        if (!navigator.onLine) {
          const cached = getFromCache(queryKey.join('_'));
          if (cached) {
            console.log('📦 Using cached data for', queryKey);
            return cached;
          }
        }
        throw error;
      }
    },
    ...options,
    staleTime: options.staleTime || 5 * 60 * 1000, // 5 minutes default
    cacheTime: options.cacheTime || 30 * 60 * 1000 // 30 minutes default
  };
};

/**
 * Offline Queue Manager
 * Queues mutations when offline, syncs when back online
 */
class OfflineQueue {
  constructor() {
    this.queue = this.loadQueue();
    this.listeners = [];
    
    // Auto-sync when coming back online
    window.addEventListener('online', () => this.processQueue());
  }

  loadQueue() {
    try {
      const stored = localStorage.getItem('leaseshield_offline_queue');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveQueue() {
    try {
      localStorage.setItem('leaseshield_offline_queue', JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (error) {
      console.warn('Failed to save offline queue:', error);
    }
  }

  add(mutation) {
    this.queue.push({
      id: Date.now(),
      mutation,
      timestamp: Date.now(),
      status: 'pending'
    });
    this.saveQueue();
  }

  async processQueue() {
    if (this.queue.length === 0) return;
    if (!navigator.onLine) return;

    console.log(`📤 Processing ${this.queue.length} offline mutations...`);

    const processedIds = [];

    for (const item of this.queue) {
      if (item.status !== 'pending') continue;

      try {
        await item.mutation();
        item.status = 'completed';
        processedIds.push(item.id);
        console.log('✅ Synced offline mutation:', item.id);
      } catch (error) {
        console.error('❌ Failed to sync mutation:', item.id, error);
        item.status = 'failed';
        item.error = error.message;
      }
    }

    // Remove completed items
    this.queue = this.queue.filter(item => item.status !== 'completed');
    this.saveQueue();

    return processedIds.length;
  }

  getQueue() {
    return this.queue;
  }

  getPendingCount() {
    return this.queue.filter(item => item.status === 'pending').length;
  }

  clear() {
    this.queue = [];
    this.saveQueue();
  }

  // Subscribe to queue changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.queue));
  }
}

export const offlineQueue = new OfflineQueue();

/**
 * Hook to use offline queue
 */
export function useOfflineQueue() {
  const [queue, setQueue] = React.useState(offlineQueue.getQueue());

  React.useEffect(() => {
    return offlineQueue.subscribe(setQueue);
  }, []);

  return {
    queue,
    pendingCount: offlineQueue.getPendingCount(),
    processQueue: () => offlineQueue.processQueue(),
    clearQueue: () => offlineQueue.clear()
  };
}