/**
 * Persistence Module Index
 * Exports all persistence-related functionality
 */

// Storage implementations
export { LocalStoragePersistence, IndexedDBPersistence, PersistenceManager, persistence, getObjectSize } from './storage';
export type { StorageOptions } from './storage';

// Cache and sync utilities
export { DataCache, SyncQueue } from './cache';
export type { PersistenceConfig, CacheEntry } from './cache';

// Database with persistence


// Configuration
export { getPersistenceSettings, defaultPersistenceSettings } from './config';
export type { PersistenceSettings, PersistenceBackend } from './config';

// Examples and utilities
export { exportProjectData, importProjectData, PersistenceManager as PersistenceManagerComponent, usePersistenceDebug } from './examples';
