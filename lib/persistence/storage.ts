/**
 * Browser-based persistence layer supporting both LocalStorage and IndexedDB
 * Automatically handles serialization and size constraints
 */

const STORAGE_PREFIX = 'vinose_';
const LOCALSTORAGE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB approximate limit
const DB_NAME = 'VinoseDatabase';
const DB_VERSION = 2; // Increment version to trigger upgrade

// List of all known store names that should be created
const KNOWN_STORES = ['vinose_db_store', 'vinose_cache_store', 'default_store'];

export interface StorageOptions {
  useIndexedDB?: boolean;
  key: string;
  namespace?: string;
}

/**
 * Get size of object in bytes (approximate)
 */
export const getObjectSize = (obj: any): number => {
  return new Blob([JSON.stringify(obj)]).size;
};

/**
 * LocalStorage-based persistence
 */
export const LocalStoragePersistence = {
  async get<T>(key: string, namespace = 'default'): Promise<T | null> {
    try {
      const prefixedKey = `${STORAGE_PREFIX}${namespace}:${key}`;
      const data = localStorage.getItem(prefixedKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn(`[LocalStorage] Failed to get ${key}:`, error);
      return null;
    }
  },

  async set<T>(key: string, value: T, namespace = 'default'): Promise<boolean> {
    try {
      const prefixedKey = `${STORAGE_PREFIX}${namespace}:${key}`;
      const serialized = JSON.stringify(value);

      // Check size before storing
      if (getObjectSize(value) > LOCALSTORAGE_SIZE_LIMIT) {
        console.warn(`[LocalStorage] Data too large for ${key}, consider using IndexedDB`);
        return false;
      }

      localStorage.setItem(prefixedKey, serialized);
      return true;
    } catch (error) {
      console.warn(`[LocalStorage] Failed to set ${key}:`, error);
      return false;
    }
  },

  async remove(key: string, namespace = 'default'): Promise<void> {
    try {
      const prefixedKey = `${STORAGE_PREFIX}${namespace}:${key}`;
      localStorage.removeItem(prefixedKey);
    } catch (error) {
      console.warn(`[LocalStorage] Failed to remove ${key}:`, error);
    }
  },

  async clear(namespace = 'default'): Promise<void> {
    try {
      const prefix = `${STORAGE_PREFIX}${namespace}:`;
      const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('[LocalStorage] Failed to clear namespace:', error);
    }
  },
};

/**
 * IndexedDB-based persistence for larger data
 */
export class IndexedDBPersistence {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase>;
  private storeName: string;

  constructor(namespace = 'default') {
    this.storeName = `${namespace}_store`;
    this.dbPromise = this.initDB();
  }

  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create all known stores during upgrade
        KNOWN_STORES.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
            console.log(`[IndexedDB] Created object store: ${storeName}`);
          }
        });

        // Also create the store for the current instance if not in known list
        if (!db.objectStoreNames.contains(this.storeName) && !KNOWN_STORES.includes(this.storeName)) {
          db.createObjectStore(this.storeName);
          console.log(`[IndexedDB] Created object store: ${this.storeName}`);
        }
      };
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
      });
    } catch (error) {
      console.warn(`[IndexedDB] Failed to get ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(value, key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(true);
      });
    } catch (error) {
      console.warn(`[IndexedDB] Failed to set ${key}:`, error);
      return false;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn(`[IndexedDB] Failed to remove ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('[IndexedDB] Failed to clear:', error);
    }
  }
}

/**
 * Unified persistence interface that chooses between LocalStorage and IndexedDB
 */
export class PersistenceManager {
  private localStorage: typeof LocalStoragePersistence;
  private indexedDB: IndexedDBPersistence;
  private useIndexedDB: boolean;
  private namespace: string;

  constructor(namespace = 'default') {
    this.localStorage = LocalStoragePersistence;
    this.indexedDB = new IndexedDBPersistence(namespace);
    this.namespace = namespace;
    this.useIndexedDB = true; // Try IndexedDB first, fallback to localStorage
  }

  async get<T>(key: string): Promise<T | null> {
    // Try IndexedDB first
    if (this.useIndexedDB) {
      const result = await this.indexedDB.get<T>(key);
      if (result !== null) return result;
    }

    // Fallback to LocalStorage
    return this.localStorage.get<T>(key, this.namespace);
  }

  async set<T>(key: string, value: T): Promise<boolean> {
    // Check size to decide storage method
    const size = getObjectSize(value);

    if (size < LOCALSTORAGE_SIZE_LIMIT) {
      // Use LocalStorage for small data
      return this.localStorage.set<T>(key, value, this.namespace);
    }

    // Use IndexedDB for larger data
    if (this.useIndexedDB) {
      return this.indexedDB.set<T>(key, value);
    }

    return false;
  }

  async remove(key: string): Promise<void> {
    await this.localStorage.remove(key, this.namespace);
    await this.indexedDB.remove(key);
  }

  async clear(): Promise<void> {
    await this.localStorage.clear(this.namespace);
    await this.indexedDB.clear();
  }
}

// Create a default instance
export const persistence = new PersistenceManager('vinose');
