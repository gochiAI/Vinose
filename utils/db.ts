import { ProjectData } from '../types';

const DB_NAME = 'VNS-DB';
const DB_VERSION = 3;
const PROJECT_STORE_NAME = 'project';
const CHAT_STORE_NAME = 'chat_history';
const PROJECT_KEY = 'currentProject';

let db: IDBDatabase | null = null;

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatHistory {
    id: number;
    messages: ChatMessage[];
    createdAt: Date;
}

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
      if (!dbInstance.objectStoreNames.contains(PROJECT_STORE_NAME)) {
        dbInstance.createObjectStore(PROJECT_STORE_NAME);
      }
      if (dbInstance.objectStoreNames.contains(CHAT_STORE_NAME)) {
        dbInstance.deleteObjectStore(CHAT_STORE_NAME);
      }
      dbInstance.createObjectStore(CHAT_STORE_NAME, { keyPath: 'id', autoIncrement: true });
    };
  });
};

export const getProjectDataFromDB = async (): Promise<ProjectData | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROJECT_STORE_NAME, 'readonly');
    const store = transaction.objectStore(PROJECT_STORE_NAME);
    const request = store.get(PROJECT_KEY);

    request.onerror = (event) => {
      console.error('Error fetching project data from DB:', request.error);
      reject('Error fetching project data');
    };

    request.onsuccess = (event) => {
      resolve(request.result as ProjectData | null);
    };
  });
};

export const saveProjectDataToDB = async (data: ProjectData): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROJECT_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(PROJECT_STORE_NAME);
    const request = store.put(data, PROJECT_KEY);

    request.onerror = (event) => {
      console.error('Error saving project data to DB:', request.error);
      reject('Error saving project data');
    };

    request.onsuccess = (event) => {
      resolve();
    };
  });
};


export const getAllChatHistories = async (): Promise<ChatHistory[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHAT_STORE_NAME, 'readonly');
        const store = transaction.objectStore(CHAT_STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject('Error fetching all chat histories');
        request.onsuccess = () => {
            const result = request.result as ChatHistory[];
            // Ensure createdAt is a Date object for sorting
            result.forEach(r => r.createdAt = new Date(r.createdAt));
            resolve(result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
        };
    });
};

export const addChatHistory = async (messages: ChatMessage[]): Promise<number> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHAT_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CHAT_STORE_NAME);
        const newHistory = { messages, createdAt: new Date() };
        const request = store.add(newHistory);

        request.onerror = () => reject('Error adding chat history');
        request.onsuccess = () => resolve(request.result as number);
    });
};

export const updateChatHistory = async (id: number, messages: ChatMessage[]): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHAT_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CHAT_STORE_NAME);
        const getRequest = store.get(id);

        getRequest.onerror = () => reject('Error fetching chat history to update');
        getRequest.onsuccess = () => {
            const data = getRequest.result as ChatHistory;
            if (data) {
                data.messages = messages;
                const putRequest = store.put(data);
                putRequest.onerror = () => reject('Error updating chat history');
                putRequest.onsuccess = () => resolve();
            } else {
                reject(`Chat history with id ${id} not found.`);
            }
        };
    });
};

export const deleteChatHistory = async (id: number): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHAT_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CHAT_STORE_NAME);
        const request = store.delete(id);

        request.onerror = () => reject('Error deleting chat history');
        request.onsuccess = () => resolve();
    });
};
