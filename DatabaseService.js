import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'buildingPlannerDB';
const DB_VERSION = 1;
const DRAWINGS_STORE = 'drawings';

/**
 * Promisify IndexedDB operations for cleaner async/await code
 */
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(DRAWINGS_STORE)) {
        const store = db.createObjectStore(DRAWINGS_STORE, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('lastModified', 'lastModified', { unique: false });
      }
    };
  });
};

const performTransaction = (db, mode, callback) => {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(DRAWINGS_STORE, mode);
      const store = transaction.objectStore(DRAWINGS_STORE);
      callback(store, resolve, reject);
      transaction.onerror = () => reject(transaction.error);
    } catch (error) {
      reject(error);
    }
  });
};

class DatabaseService {
  constructor() {
    this.dbPromise = openDB();
  }

  async ensureDB() {
    return this.dbPromise;
  }

  async saveDrawing(name, shapes) {
    if (!name?.trim()) {
      throw new Error('Drawing name cannot be empty');
    }

    const db = await this.ensureDB();
    
    return performTransaction(db, 'readwrite', async (store, resolve, reject) => {
      try {
        const index = store.index('name');
        const getRequest = index.get(name);
        
        getRequest.onsuccess = () => {
          const existing = getRequest.result;
          const drawing = {
            id: existing?.id || uuidv4(),
            name,
            shapes: JSON.parse(JSON.stringify(shapes)),
            created: existing?.created || new Date().toISOString(),
            lastModified: new Date().toISOString()
          };

          const saveRequest = existing ? store.put(drawing) : store.add(drawing);
          saveRequest.onsuccess = () => resolve(drawing);
          saveRequest.onerror = () => reject(saveRequest.error);
        };
        
        getRequest.onerror = () => reject(getRequest.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getDrawingById(id) {
    const db = await this.ensureDB();
    
    return performTransaction(db, 'readonly', (store, resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllDrawings() {
    const db = await this.ensureDB();
    
    return performTransaction(db, 'readonly', (store, resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDrawing(id) {
    const db = await this.ensureDB();
    
    return performTransaction(db, 'readwrite', (store, resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllDrawings() {
    const db = await this.ensureDB();
    
    return performTransaction(db, 'readwrite', (store, resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export default new DatabaseService();