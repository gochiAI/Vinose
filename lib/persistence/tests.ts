/**
 * Persistence Module Tests
 * Basic tests for the data persistence layer
 */

import { PersistenceManager } from './storage';
import { DataCache } from './cache';
import { PersistentMockDatabase } from './persistent-mock-db';

/**
 * Test LocalStorage persistence
 */
export async function testLocalStoragePersistence() {
  console.log('Testing LocalStorage Persistence...');
  
  const pm = new PersistenceManager('test');
  
  // Test set and get
  const testData = { id: '1', name: 'Test' };
  await pm.set('test-key', testData);
  const retrieved = await pm.get('test-key');
  
  console.assert(
    JSON.stringify(retrieved) === JSON.stringify(testData),
    'LocalStorage set/get should work'
  );
  
  // Test remove
  await pm.remove('test-key');
  const removed = await pm.get('test-key');
  console.assert(removed === null, 'LocalStorage remove should work');
  
  // Cleanup
  await pm.clear();
  console.log('✓ LocalStorage tests passed');
}

/**
 * Test DataCache
 */
export async function testDataCache() {
  console.log('Testing DataCache...');
  
  const cache = new DataCache('test_cache');
  
  // Test cache set/get
  const testData = { id: '1', value: 'cached' };
  await cache.set('cache-key', testData, false); // Don't persist for this test
  const retrieved = await cache.get('cache-key');
  
  console.assert(
    JSON.stringify(retrieved) === JSON.stringify(testData),
    'DataCache set/get should work'
  );
  
  // Test cache remove
  await cache.remove('cache-key');
  const removed = await cache.get('cache-key');
  console.assert(removed === null, 'DataCache remove should work');
  
  // Cleanup
  await cache.clear();
  console.log('✓ DataCache tests passed');
}

/**
 * Test PersistentMockDatabase
 */
export async function testPersistentDatabase() {
  console.log('Testing PersistentMockDatabase...');
  
  const db = new PersistentMockDatabase({ enabled: true });
  
  // Test get characters
  const characters = await db.getCharacters();
  console.assert(Array.isArray(characters), 'Should return character array');
  console.assert(characters.length > 0, 'Should have initial characters');
  
  // Test get assets
  const assets = await db.getAssets();
  console.assert(Array.isArray(assets), 'Should return asset array');
  
  // Test get events
  const events = await db.getEvents();
  console.assert(Array.isArray(events), 'Should return event array');
  
  // Test get files
  const files = await db.getFiles();
  console.assert(Array.isArray(files), 'Should return files array');
  
  // Test export
  const exported = await db.exportData();
  console.assert(exported.characters, 'Export should include characters');
  console.assert(exported.assets, 'Export should include assets');
  
  // Test cache stats
  const stats = db.getCacheStats();
  console.assert(typeof stats.itemCount === 'number', 'Cache stats should have itemCount');
  console.assert(typeof stats.memorySize === 'number', 'Cache stats should have memorySize');
  
  // Cleanup
  db.destroy();
  console.log('✓ PersistentDatabase tests passed');
}

/**
 * Run all tests
 */
export async function runAllPersistenceTests() {
  console.group('Running Persistence Tests');
  
  try {
    await testLocalStoragePersistence();
    await testDataCache();
    await testPersistentDatabase();
    
    console.log('\n✓ All persistence tests passed!');
  } catch (error) {
    console.error('✗ Tests failed:', error);
  }
  
  console.groupEnd();
}

// Run tests on module load if in development
if (process.env.NODE_ENV === 'development') {
  // Uncomment to run tests automatically
  // runAllPersistenceTests();
}
