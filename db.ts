import type { Incident, Resource, AttendanceRecord, Announcement, Student, Teacher } from './types';
import { MOCK_ANNOUNCEMENTS } from './constants';

const DB_NAME = 'AulaIntegralMayaDB';
const DB_VERSION = 7; // Incremented version to fix unique index issue
const INCIDENTS_STORE_NAME = 'incidents';
const RESOURCES_STORE_NAME = 'resources';
const ATTENDANCE_STORE_NAME = 'attendance';
const ANNOUNCEMENTS_STORE_NAME = 'announcements';
const STUDENTS_STORE_NAME = 'students';
const TEACHERS_STORE_NAME = 'teachers';


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
      const transaction = (event.target as IDBOpenDBRequest).transaction;

      if (!db.objectStoreNames.contains(INCIDENTS_STORE_NAME)) {
        const incidentsStore = db.createObjectStore(INCIDENTS_STORE_NAME, { keyPath: 'id' });
        incidentsStore.createIndex('synced', 'synced', { unique: false });
        incidentsStore.createIndex('studentId', 'studentId', { unique: false });
      }
      if (!db.objectStoreNames.contains(RESOURCES_STORE_NAME)) {
        db.createObjectStore(RESOURCES_STORE_NAME, { keyPath: 'id' });
      }

      let attendanceStore: IDBObjectStore;
      if (!db.objectStoreNames.contains(ATTENDANCE_STORE_NAME)) {
        attendanceStore = db.createObjectStore(ATTENDANCE_STORE_NAME, { keyPath: 'id' });
      } else if (transaction) {
        attendanceStore = transaction.objectStore(ATTENDANCE_STORE_NAME);
      } else {
        return; 
      }
      
      if (!attendanceStore.indexNames.contains('date')) {
        attendanceStore.createIndex('date', 'date', { unique: false });
      }
      if (!attendanceStore.indexNames.contains('studentId')) {
        attendanceStore.createIndex('studentId', 'studentId', { unique: false });
      }

      if (!db.objectStoreNames.contains(ANNOUNCEMENTS_STORE_NAME)) {
        db.createObjectStore(ANNOUNCEMENTS_STORE_NAME, { keyPath: 'id' });
      }

      // Add new stores for students and teachers
      if (!db.objectStoreNames.contains(STUDENTS_STORE_NAME)) {
          db.createObjectStore(STUDENTS_STORE_NAME, { keyPath: 'id' });
      }
       
      // FIX: Ensure teachers store and email index exist
      let teachersStore: IDBObjectStore;
      if (!db.objectStoreNames.contains(TEACHERS_STORE_NAME)) {
          teachersStore = db.createObjectStore(TEACHERS_STORE_NAME, { keyPath: 'id' });
      } else if (transaction) {
          teachersStore = transaction.objectStore(TEACHERS_STORE_NAME);
      } else {
          return;
      }
      if (!teachersStore.indexNames.contains('email')) {
          // The `unique` constraint is set to false. A unique index will throw an error if multiple
          // teachers have an undefined or null email. The application logic in `handleSaveTeachers`
          // is now responsible for enforcing email uniqueness for non-empty emails.
          teachersStore.createIndex('email', 'email', { unique: false });
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

// --- Attendance Functions ---

export const addOrUpdateAttendanceRecord = (record: AttendanceRecord): Promise<void> => {
    return new Promise((resolve, reject) => {
        const store = getStore(ATTENDANCE_STORE_NAME, 'readwrite');
        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getAttendanceForDate = (date: string): Promise<AttendanceRecord[]> => {
    return new Promise((resolve, reject) => {
        const store = getStore(ATTENDANCE_STORE_NAME, 'readonly');
        const index = store.index('date');
        const request = index.getAll(IDBKeyRange.only(date));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getAllAttendanceRecords = (): Promise<AttendanceRecord[]> => {
    return new Promise((resolve, reject) => {
        const store = getStore(ATTENDANCE_STORE_NAME, 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        request.onerror = () => reject(request.error);
    });
};

// --- Teacher Functions ---

// FIX: Add getTeacherByEmail function
export const getTeacherByEmail = (email: string): Promise<Teacher | undefined> => {
  return new Promise((resolve, reject) => {
    if (!db) {
        return reject("DB not initialized");
    }
    const store = getStore(TEACHERS_STORE_NAME, 'readonly');
    const index = store.index('email');
    const request = index.get(email);
    request.onsuccess = () => {
      resolve(request.result as Teacher | undefined);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const updateTeacher = (teacher: Teacher): Promise<void> => {
  return new Promise((resolve, reject) => {
    const store = getStore(TEACHERS_STORE_NAME, 'readwrite');
    const request = store.put(teacher);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- Announcement Functions ---
export const addAnnouncement = (announcement: Announcement): Promise<void> => {
  return new Promise((resolve, reject) => {
    const store = getStore(ANNOUNCEMENTS_STORE_NAME, 'readwrite');
    const request = store.add(announcement);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAnnouncements = (): Promise<Announcement[]> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ANNOUNCEMENTS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(ANNOUNCEMENTS_STORE_NAME);
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      if (countRequest.result === 0) {
        // Store is empty, seed it with mock data
        let completed = 0;
        MOCK_ANNOUNCEMENTS.forEach(ann => {
          const addReq = store.add(ann);
          addReq.onsuccess = () => {
            completed++;
            if (completed === MOCK_ANNOUNCEMENTS.length) {
              // After all are added, resolve with the mock data
              resolve([...MOCK_ANNOUNCEMENTS].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            }
          };
          addReq.onerror = () => reject(addReq.error);
        });
      } else {
        // Store has data, just get all
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => resolve(getAllRequest.result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        getAllRequest.onerror = () => reject(getAllRequest.error);
      }
    };
    countRequest.onerror = () => reject(countRequest.error);
  });
};


// --- Student and Teacher Functions ---

const bulkUpdate = <T>(storeName: string, data: T[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        store.clear(); // Clear existing data
        let completed = 0;
        if (data.length === 0) {
            resolve();
            return;
        }
        data.forEach(item => {
            const request = store.put(item);
            request.onsuccess = () => {
                completed++;
                if (completed === data.length) {
                    resolve();
                }
            };
        });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getStudents = (): Promise<Student[]> => {
    return new Promise((resolve, reject) => {
        const store = getStore(STUDENTS_STORE_NAME, 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result.sort((a,b) => a.name.localeCompare(b.name)));
        request.onerror = () => reject(request.error);
    });
};

export const addOrUpdateStudents = (students: Student[]): Promise<void> => {
    return bulkUpdate(STUDENTS_STORE_NAME, students);
};

export const getTeachers = (): Promise<Teacher[]> => {
    return new Promise((resolve, reject) => {
        const store = getStore(TEACHERS_STORE_NAME, 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result.sort((a,b) => a.name.localeCompare(b.name)));
        request.onerror = () => reject(request.error);
    });
};

export const addOrUpdateTeachers = (teachers: Teacher[]): Promise<void> => {
    return bulkUpdate(TEACHERS_STORE_NAME, teachers);
};