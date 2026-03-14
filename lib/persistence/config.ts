/**
 * Persistence Configuration Module
 * 
 * This module provides configuration options for data persistence in the application.
 * It supports both browser-based storage (LocalStorage, IndexedDB) and future cloud integration.
 */

export type PersistenceBackend = 'auto' | 'localstorage' | 'indexeddb' | 'firestore' | 'mongodb';

export interface PersistenceSettings {
  /** Enable or disable data persistence */
  enabled: boolean;
  
  /** Storage backend to use */
  backend: PersistenceBackend;
  
  /** Enable automatic saving of changes */
  autoSave: boolean;
  
  /** Interval (in milliseconds) for auto-save */
  autoSaveInterval: number;
  
  /** Enable offline mode - queue changes when offline */
  enableOfflineMode: boolean;
  
  /** Enable compression for stored data */
  enableCompression: boolean;
  
  /** Storage size limit in bytes (5MB by default) */
  storageSizeLimit: number;
  
  /** Cache expiration time in milliseconds (1 hour by default) */
  cacheExpiration: number;
  
  /** Enable version tracking */
  enableVersioning: boolean;
  
  /** Number of versions to keep in history */
  maxVersions: number;
}

export const defaultPersistenceSettings: PersistenceSettings = {
  enabled: true,
  backend: 'auto',
  autoSave: true,
  autoSaveInterval: 30000, // 30 seconds
  enableOfflineMode: true,
  enableCompression: false, // Can be enabled for large datasets
  storageSizeLimit: 5 * 1024 * 1024, // 5MB
  cacheExpiration: 60 * 60 * 1000, // 1 hour
  enableVersioning: true,
  maxVersions: 10,
};

/**
 * Get persistence settings from environment variables
 */
export function getPersistenceSettings(): PersistenceSettings {
  return {
    enabled: process.env.REACT_APP_PERSISTENCE_ENABLED !== 'false',
    backend: (process.env.REACT_APP_PERSISTENCE_BACKEND as PersistenceBackend) || 'auto',
    autoSave: process.env.REACT_APP_AUTO_SAVE !== 'false',
    autoSaveInterval: parseInt(process.env.REACT_APP_AUTO_SAVE_INTERVAL || '30000', 10),
    enableOfflineMode: process.env.REACT_APP_OFFLINE_MODE !== 'false',
    enableCompression: process.env.REACT_APP_COMPRESSION === 'true',
    storageSizeLimit: parseInt(process.env.REACT_APP_STORAGE_LIMIT || '5242880', 10),
    cacheExpiration: parseInt(process.env.REACT_APP_CACHE_EXPIRATION || '3600000', 10),
    enableVersioning: process.env.REACT_APP_VERSIONING !== 'false',
    maxVersions: parseInt(process.env.REACT_APP_MAX_VERSIONS || '10', 10),
  };
}

export { defaultPersistenceSettings as config };
