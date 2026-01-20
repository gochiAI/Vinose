# Data Persistence Architecture

## Overview

This module implements a robust data persistence layer for the Vinose application, supporting offline-first capabilities with automatic synchronization and flexible storage backends.

## Features

### 1. **Dual Storage Backend**
- **LocalStorage**: Fast, synchronous access for small data (<5MB)
- **IndexedDB**: Asynchronous, supports larger datasets and structured queries
- Automatic backend selection based on data size

### 2. **Smart Caching**
- In-memory cache with configurable TTL
- Automatic cache invalidation
- Cache statistics and monitoring

### 3. **Offline Support**
- Sync queue for tracking unsaved changes
- Automatic sync when connection restored
- Offline-first operation mode

### 4. **Auto-Save**
- Configurable auto-save intervals (default: 30 seconds)
- Prevents data loss during development
- Non-blocking background saves

### 5. **Data Import/Export**
- Full project data export to JSON
- Batch import functionality
- Backup and restore capabilities

## Architecture

```
┌─────────────────────────────────────┐
│     React Components / Hooks        │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│   DatabaseContext + usePersistence  │
│   (Unified Data Access Layer)       │
└────────────────┬────────────────────┘
                 │
┌────────────────▼──────────────────────────┐
│  PersistentMockDatabase                   │
│  (Business Logic + Persistence Logic)     │
└────────────────┬──────────────────────────┘
                 │
    ┌────────────┴─────────────┐
    │                          │
┌───▼──────────┐    ┌─────────▼──────┐
│ DataCache    │    │  SyncQueue     │
│ (In-Memory   │    │ (Offline Ops)  │
│  + Persist)  │    │                │
└───┬──────────┘    └─────────┬──────┘
    │                         │
    │   ┌─────────────────────┘
    │   │
┌───▼───▼──────────────────────────┐
│  PersistenceManager              │
│  (Unified Storage Interface)      │
└───┬──────────────────────────────┘
    │
    │   ┌──────────────────────┐
    │   │ LocalStorage         │
    ├─► │ (Small Data <5MB)    │
    │   └──────────────────────┘
    │
    │   ┌──────────────────────┐
    │   │ IndexedDB            │
    └─► │ (Large Data)         │
        └──────────────────────┘
```

## Usage

### Basic Setup

The persistence layer is automatically enabled in the application. To disable it:

```tsx
// In your .env file or environment variables
REACT_APP_PERSISTENCE_ENABLED=false
```

### Using the Database with Persistence

```tsx
import { useDatabase, usePersistence } from '../contexts/DatabaseContext';

function MyComponent() {
  const db = useDatabase();
  const { exportData, importData, clearStorage } = usePersistence();

  // Save a character (automatically persisted)
  const handleSaveCharacter = async (character) => {
    await db.saveCharacter(character);
  };

  // Export all data
  const handleExport = async () => {
    const data = await exportData();
    console.log('Exported data:', data);
  };

  // Clear all stored data
  const handleClearStorage = async () => {
    await clearStorage();
  };

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### Configuration

#### Environment Variables

```env
# Enable/disable persistence
REACT_APP_PERSISTENCE_ENABLED=true

# Storage backend: 'auto' | 'localstorage' | 'indexeddb'
REACT_APP_PERSISTENCE_BACKEND=auto

# Auto-save configuration
REACT_APP_AUTO_SAVE=true
REACT_APP_AUTO_SAVE_INTERVAL=30000

# Offline mode
REACT_APP_OFFLINE_MODE=true

# Storage limits
REACT_APP_STORAGE_LIMIT=5242880  # 5MB in bytes

# Cache settings
REACT_APP_CACHE_EXPIRATION=3600000  # 1 hour in milliseconds

# Versioning
REACT_APP_VERSIONING=true
REACT_APP_MAX_VERSIONS=10
```

#### Programmatic Configuration

```tsx
import { PersistentMockDatabase } from '../lib/persistence/persistent-mock-db';

const db = new PersistentMockDatabase({
  enabled: true,
  autoSave: true,
  autoSaveInterval: 30000,
});
```

## Data Storage Structure

### LocalStorage Keys
- Format: `vinose_<namespace>:<key>`
- Example: `vinose_vinose:characters`

### IndexedDB Database
- **Database Name**: `VinoseDatabase`
- **Version**: 1
- **Object Stores**: One per namespace
  - Each store contains serialized data

### Sync Queue
- Tracks unsaved changes in offline mode
- Format: Array of operation records
- Stored in: `vinose_vinose:sync_queue`

## Cache Management

### Cache Entry Structure
```typescript
{
  data: T;              // Actual data
  timestamp: number;    // When cached
  version: number;      // Cache version
}
```

### Cache Behavior
- Entries expire after 1 hour (configurable)
- Automatic invalidation on version change
- In-memory storage with persistent backup

## API Reference

### PersistenceManager

```typescript
class PersistenceManager {
  // Get data from storage
  async get<T>(key: string): Promise<T | null>;
  
  // Save data to storage
  async set<T>(key: string, value: T): Promise<boolean>;
  
  // Remove data from storage
  async remove(key: string): Promise<void>;
  
  // Clear all data in namespace
  async clear(): Promise<void>;
}
```

### PersistentMockDatabase

```typescript
interface PersistentMockDatabase extends DatabaseAdapter {
  // Export all data as JSON
  exportData(): Promise<any>;
  
  // Import data from JSON
  importData(data: any): Promise<void>;
  
  // Clear all storage
  clearStorage(): Promise<void>;
  
  // Get pending sync operations count
  getSyncQueueSize(): number;
  
  // Get cache statistics
  getCacheStats(): { memorySize: number; itemCount: number };
  
  // Cleanup resources
  destroy(): void;
}
```

### usePersistence Hook

```typescript
interface usePersistence {
  exportData: () => Promise<any>;
  importData: (data: any) => Promise<void>;
  clearStorage: () => Promise<void>;
  getSyncQueueSize: () => number;
  getCacheStats: () => { memorySize: number; itemCount: number };
}
```

## Data Synchronization

### Offline Operations Flow

1. **User Action** → Change detected
2. **Add to Sync Queue** → Operation stored locally
3. **Try Save** → Attempt network request
4. **If Offline** → Queue persisted, wait for connection
5. **Connection Restored** → Automatic sync begins
6. **Sync Complete** → Clear from queue

### Sync Queue Structure

```typescript
{
  id: string;              // Operation ID
  operation: 'save' | 'delete' | 'create';
  entity: string;          // Entity type (e.g., 'ExtendedCharacter')
  data: any;               // Entity data
  timestamp: number;       // When operation was queued
}
```

## Performance Considerations

### Memory Usage
- In-memory cache stores frequently accessed data
- Cache size monitored via `getCacheStats()`
- Automatic cleanup on cache expiration

### Storage Limits
- LocalStorage: ~5MB (browser dependent)
- IndexedDB: Much larger (50MB+ typically)
- Automatic backend selection handles size

### Auto-Save Performance
- Non-blocking interval-based saves
- Default: 30-second intervals
- Configurable per use case

## Best Practices

1. **Monitor Sync Queue**: Check `getSyncQueueSize()` for pending operations
2. **Export Regularly**: Use `exportData()` for backups
3. **Clear Cache**: Call `clearStorage()` when needed
4. **Test Offline**: Disable network in DevTools to test offline mode
5. **Monitor Cache**: Use `getCacheStats()` to track memory usage

## Troubleshooting

### Data Not Persisting
- Check if persistence is enabled in environment
- Verify browser supports LocalStorage/IndexedDB
- Check browser's privacy settings

### Excessive Memory Usage
- Monitor cache stats: `getCacheStats()`
- Reduce `autoSaveInterval` if too high
- Clear old cache entries manually

### Offline Sync Issues
- Check sync queue size: `getSyncQueueSize()`
- Review browser console for errors
- Export data as backup

### Performance Issues
- Reduce data volume being cached
- Increase auto-save intervals
- Use IndexedDB backend for large datasets

## Future Enhancements

1. **Firestore Integration**: Cloud synchronization
2. **MongoDB Integration**: Backend persistence
3. **Compression**: Reduce storage size
4. **Encryption**: Secure sensitive data
5. **Selective Sync**: Choose what to persist
6. **Conflict Resolution**: Handle sync conflicts
7. **Real-time Collaboration**: Multi-user support

## Testing

### Unit Tests
```typescript
// Test persistence manager
const pm = new PersistenceManager('test');
await pm.set('key', { data: 'value' });
const result = await pm.get('key');
expect(result).toEqual({ data: 'value' });
```

### Integration Tests
```typescript
// Test with database
const db = new PersistentMockDatabase({ enabled: true });
const character = await db.getCharacters();
expect(character).toBeDefined();
```

### Browser Testing
- Open DevTools → Application tab
- Inspect LocalStorage and IndexedDB
- Simulate offline mode via Network tab
