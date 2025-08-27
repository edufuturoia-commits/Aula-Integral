import type { Incident, Resource } from './types';

const DB_NAME = 'AulaIntegralDB';
const DB_VERSION = 2; // Incremented version to trigger onupgradeneeded
const INCIDENTS_STORE_NAME = 'incidents';
const RESOURCES_STORE_NAME = 'resources';

let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(true);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', request.error);
      reject(false);
    };

    request.onsuccess = (event) => {
      db = request.result;
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(INCIDENTS_STORE_NAME)) {
        const incidentsStore = db.createObjectStore(INCIDENTS_STORE_NAME, { keyPath: 'id' });
        incidentsStore.createIndex('synced', 'synced', { unique: false });
        incidentsStore.createIndex('studentId', 'studentId', { unique: false });
      }
      if (!db.objectStoreNames.contains(RESOURCES_STORE_NAME)) {
        db.createObjectStore(RESOURCES_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Generic helper for store transactions
const getStore = (storeName: string, mode: IDBTransactionMode): IDBObjectStore => {
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

// --- Incident Functions ---

export const addIncident = (incident: Incident): Promise<void> => {
  return new Promise((resolve, reject) => {
    const store = getStore(INCIDENTS_STORE_NAME, 'readwrite');
    const request = store.add(incident);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const updateIncident = (incident: Incident): Promise<void> => {
  return new Promise((resolve, reject) => {
    const store = getStore(INCIDENTS_STORE_NAME, 'readwrite');
    const request = store.put(incident);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deleteIncident = (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const store = getStore(INCIDENTS_STORE_NAME, 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getIncidents = (): Promise<Incident[]> => {
  return new Promise((resolve, reject) => {
    const store = getStore(INCIDENTS_STORE_NAME, 'readonly');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    request.onerror = () => reject(request.error);
  });
};

export const getUnsyncedIncidents = (): Promise<Incident[]> => {
  return new Promise((resolve, reject) => {
    const store = getStore(INCIDENTS_STORE_NAME, 'readonly');
    const index = store.index('synced');
    const request = index.getAll(IDBKeyRange.only('false')); // This is how you query a boolean index
    request.onsuccess = () => {
        // Since IndexedDB stores booleans, but we might have stored them as strings or booleans, let's be safe
        const results = request.result.filter(item => item.synced === false || item.synced === 'false');
        resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};


// --- Resource Functions ---

export const addResource = (resource: Resource): Promise<void> => {
    return new Promise((resolve, reject) => {
        const store = getStore(RESOURCES_STORE_NAME, 'readwrite');
        const request = store.put(resource); // Use put to add or update
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const removeResource = (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const store = getStore(RESOURCES_STORE_NAME, 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getDownloadedResources = (): Promise<Resource[]> => {
    return new Promise((resolve, reject) => {
        const store = getStore(RESOURCES_STORE_NAME, 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};