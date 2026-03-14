import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { DatabaseAdapter } from '../lib/db/types';
import { SQLiteDatabaseAdapter } from '../lib/persistence/sqlite-adapter';

// In the future, import FirestoreAdapter or MongoAdapter here
// import { FirestoreAdapter } from '../lib/db/firestore';

const DatabaseContext = createContext<DatabaseAdapter | null>(null);

// Environment variable to control persistence backend
// Default to SQLite backend for production use
const USE_SQLITE_BACKEND = process.env.REACT_APP_USE_SQLITE !== 'false'; // Default: true
const SQLITE_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const USE_PERSISTENCE = process.env.REACT_APP_USE_PERSISTENCE === 'true' && !USE_SQLITE_BACKEND;

export const DatabaseProvider = ({ children }: { children?: React.ReactNode }) => {
  // This is where you switch between Mock, SQLite, Firebase, etc. based on ENV variables
  const db = useMemo(() => {
    // if (process.env.REACT_APP_USE_FIREBASE) return new FirestoreAdapter();
    if (USE_SQLITE_BACKEND) {
      return new SQLiteDatabaseAdapter({
        baseUrl: SQLITE_BACKEND_URL,
        timeout: 30000,
      });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (db) {

      }
    };
  }, [db]);

  return (
    <DatabaseContext.Provider value={db}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

// Hook to access persistence features if available
export const usePersistence = () => {
  const db = useDatabase();
  
  if (!db) {
    return {
      exportData: () => Promise.resolve(null),
      importData: () => Promise.resolve(),
      clearStorage: () => Promise.resolve(),
      getSyncQueueSize: () => 0,
      getCacheStats: () => ({ memorySize: 0, itemCount: 0 }),
    };
  }

  return {

  };
};