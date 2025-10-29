import { ProjectData } from '../types';

const DB_NAME = 'VNS-DB';
const DB_VERSION = 1;
const STORE_NAME = 'project';
const PROJECT_KEY = 'currentProject';

let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', request.error);
      reject('Database error');
    };

    request.onsuccess = (event) => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const getProjectDataFromDB = async (): Promise<ProjectData | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(PROJECT_KEY);

    request.onerror = (event) => {
      console.error('Error fetching data from DB:', request.error);
      reject('Error fetching data');
    };

    request.onsuccess = (event) => {
      resolve(request.result as ProjectData | null);
    };
  });
};

export const saveProjectDataToDB = async (data: ProjectData): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data, PROJECT_KEY);

    request.onerror = (event) => {
      console.error('Error saving data to DB:', request.error);
      reject('Error saving data');
    };

    request.onsuccess = (event) => {
      resolve();
    };
  });
};
