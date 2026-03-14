/**
 * Extended DatabaseAdapter interface with persistence capabilities
 */

import { DatabaseAdapter } from '../db/types';
import { SceneNode,Episode,ExtendedCharacter, Asset, FileItem, Chapter } from '../../types';
import { PersistenceManager } from './storage';

export interface PersistenceConfig {
  enabled: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
  enableOfflineMode?: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

/**
 * Cache layer for managing in-memory and persistent storage
 */
export class DataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private persistence: PersistenceManager;
  private cacheVersion = 1;

  constructor(private namespace = 'cache') {
    this.persistence = new PersistenceManager(namespace);
  }

  async get<T>(key: string): Promise<T | null> {
    // Check in-memory cache first
    const cached = this.cache.get(key);
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }

    // Try persistent storage
    try {
      const persisted = await this.persistence.get<CacheEntry<T>>(key);
      if (persisted && this.isCacheValid(persisted)) {
        // Restore to memory
        this.cache.set(key, persisted);
        return persisted.data;
      }
    } catch (error) {
      console.warn(`[DataCache] Failed to retrieve from persistence:`, error);
    }

    return null;
  }

  async set<T>(key: string, data: T, persist = true): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: this.cacheVersion,
    };

    // Store in memory
    this.cache.set(key, entry);

    // Store in persistent storage
    if (persist) {
      try {
        await this.persistence.set<CacheEntry<T>>(key, entry);
      } catch (error) {
        console.warn(`[DataCache] Failed to persist ${key}:`, error);
      }
    }
  }

  async remove(key: string): Promise<void> {
    this.cache.delete(key);
    await this.persistence.remove(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    await this.persistence.clear();
  }

  private isCacheValid(entry: CacheEntry<any>): boolean {
    // Consider cache valid for 1 hour
    const cacheExpiry = 60 * 60 * 1000;
    return Date.now() - entry.timestamp < cacheExpiry && entry.version === this.cacheVersion;
  }

  getCacheStats(): {
    memorySize: number;
    itemCount: number;
  } {
    return {
      memorySize: Array.from(this.cache.values()).reduce(
        (sum, entry) => sum + JSON.stringify(entry.data).length,
        0
      ),
      itemCount: this.cache.size,
    };
  }
}

/**
 * Sync queue for managing offline operations
 */
export class SyncQueue {
  private queue: Array<{
    id: string;
    operation: 'save' | 'delete' | 'create';
    entity: string;
    data: any;
    timestamp: number;
  }> = [];

  constructor(private persistence: PersistenceManager) {
    this.loadQueue();
  }

  private async loadQueue(): Promise<void> {
    try {
      const saved = await this.persistence.get<Array<{
        id: string;
        operation: 'save' | 'delete' | 'create';
        entity: string;
        data: any;
        timestamp: number;
      }>>('sync_queue');
      this.queue = saved || [];
    } catch (error) {
      console.warn('[SyncQueue] Failed to load queue:', error);
    }
  }

  async add(
    operation: 'save' | 'delete' | 'create',
    entity: string,
    data: any,
    id: string
  ): Promise<void> {
    this.queue.push({
      id,
      operation,
      entity,
      data,
      timestamp: Date.now(),
    });
    await this.persist();
  }

  getQueue() {
    return [...this.queue];
  }

  async removeItem(id: string): Promise<void> {
    this.queue = this.queue.filter(item => item.id !== id);
    await this.persist();
  }

  async clear(): Promise<void> {
    this.queue = [];
    await this.persist();
  }

  private async persist(): Promise<void> {
    try {
      await this.persistence.set('sync_queue', this.queue);
    } catch (error) {
      console.warn('[SyncQueue] Failed to persist queue:', error);
    }
  }

  getSize(): number {
    return this.queue.length;
  }
}
