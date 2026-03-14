/**
 * Example usage of the persistence layer
 * This file demonstrates how to use the data persistence features
 */

import React from 'react';
import { useDatabase, usePersistence } from '../../contexts/DatabaseContext';

/**
 * Example: Exporting data
 */
export async function exportProjectData() {
  const db = useDatabase() as any;
  
  if (db.exportData) {
    const data = await db.exportData();
    const json = JSON.stringify(data, null, 2);
    
    // Download as file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vinose-project-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Example: Importing data
 */
export async function importProjectData(file: File) {
  const db = useDatabase() as any;
  
  const text = await file.text();
  const data = JSON.parse(text);
  
  if (db.importData) {
    await db.importData(data);
  }
}

/**
 * Example React Component: Persistence Manager
 */
export function PersistenceManager() {
  const { exportData, importData, clearStorage, getSyncQueueSize, getCacheStats } = usePersistence();

  const handleExport = async () => {
    const data = await exportData();
    const json = JSON.stringify(data, null, 2);
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vinose-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      const data = JSON.parse(text);
      await importData(data);
      alert('Data imported successfully');
    }
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all stored data?')) {
      await clearStorage();
      alert('Storage cleared');
    }
  };

  const stats = getCacheStats();
  const syncQueueSize = getSyncQueueSize();

  return (
    <div className="persistence-manager">
      <h3>Data Persistence</h3>
      
      <div className="persistence-stats">
        <p>Cache: {stats.itemCount} items, {(stats.memorySize / 1024).toFixed(2)}KB</p>
        <p>Sync Queue: {syncQueueSize} pending operations</p>
      </div>

      <div className="persistence-actions">
        <button onClick={handleExport}>Export Data</button>
        
        <label>
          Import Data
          <input 
            type="file" 
            accept=".json" 
            onChange={handleImport} 
            style={{ display: 'none' }}
          />
        </label>
        
        <button onClick={handleClear} style={{ color: 'red' }}>
          Clear Storage
        </button>
      </div>

      <style>{`
        .persistence-manager {
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: #f9f9f9;
        }
        
        .persistence-stats {
          margin: 1rem 0;
          font-size: 0.9rem;
          color: #666;
        }
        
        .persistence-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        
        button {
          padding: 0.5rem 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: white;
          cursor: pointer;
        }
        
        button:hover {
          background: #f0f0f0;
        }
      `}</style>
    </div>
  );
}

/**
 * Example: Monitoring persistence in development
 */
export function usePersistenceDebug() {
  const { getCacheStats, getSyncQueueSize } = usePersistence();

  React.useEffect(() => {
    const interval = setInterval(() => {
      const stats = getCacheStats();
      const queueSize = getSyncQueueSize();
      
      
        cacheItems: stats.itemCount,
        cacheMemory: `${(stats.memorySize / 1024).toFixed(2)}KB`,
        pendingOps: queueSize,
        timestamp: new Date().toISOString(),
      });
    }, 60000); // Log every 60 seconds

    return () => clearInterval(interval);
  }, [getCacheStats, getSyncQueueSize]);
}
