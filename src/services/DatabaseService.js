import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'buildingPlannerDB';
const DB_VERSION = 1;
const DRAWINGS_STORE = 'drawings';

class DatabaseService {
  constructor() {
    this.db = null;
    this.initDB();
  }

  initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('Error opening database:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(DRAWINGS_STORE)) {
          const drawingStore = db.createObjectStore(DRAWINGS_STORE, { keyPath: 'id' });
          drawingStore.createIndex('name', 'name', { unique: false });
          drawingStore.createIndex('lastModified', 'lastModified', { unique: false });
          console.log('Drawings store created');
        }
      };
    });
  }

  ensureDBConnection() {
    if (this.db) {
      return Promise.resolve();
    }
    return this.initDB();
  }

  // Save a drawing to the database
  async saveDrawing(name, shapes) {
    await this.ensureDBConnection();
    
    return new Promise((resolve, reject) => {
      try {
        // First check if a drawing with this name exists
        const getRequest = this.db
          .transaction(DRAWINGS_STORE, 'readonly')
          .objectStore(DRAWINGS_STORE)
          .index('name')
          .get(name);
        
        getRequest.onsuccess = (event) => {
          try {
            const existingDrawing = event.target.result;
            const transaction = this.db.transaction(DRAWINGS_STORE, 'readwrite');
            const store = transaction.objectStore(DRAWINGS_STORE);
            
            // Create a serializable version of shapes by removing any non-serializable properties
            // This converts shapes to a simple JSON structure
            const serializableShapes = JSON.parse(JSON.stringify(shapes));
            
            const drawing = {
              shapes: serializableShapes,
              lastModified: new Date().toISOString(),
              name
            };
            
            let request;
            
            if (existingDrawing) {
              drawing.id = existingDrawing.id;
              request = store.put(drawing);
            } else {
              drawing.id = uuidv4();
              drawing.created = new Date().toISOString();
              request = store.add(drawing);
            }
            
            request.onsuccess = () => {
              resolve(drawing);
            };
            
            request.onerror = (err) => {
              console.error('Error saving drawing:', err);
              reject(err.target.error);
            };
          } catch (error) {
            console.error('Error in onsuccess handler:', error);
            reject(error);
          }
        };
        
        getRequest.onerror = (err) => {
          console.error('Error checking for existing drawing:', err);
          reject(err.target.error);
        };
      } catch (error) {
        console.error('Unexpected error in saveDrawing:', error);
        reject(error);
      }
    });
  }

  // Load a drawing by its ID
  async getDrawingById(id) {
    await this.ensureDBConnection();
    
    return new Promise((resolve, reject) => {
      const request = this.db
        .transaction(DRAWINGS_STORE, 'readonly')
        .objectStore(DRAWINGS_STORE)
        .get(id);
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (err) => {
        reject(err.target.error);
      };
    });
  }

  // Load a drawing by name
  async getDrawingByName(name) {
    await this.ensureDBConnection();
    
    return new Promise((resolve, reject) => {
      const request = this.db
        .transaction(DRAWINGS_STORE, 'readonly')
        .objectStore(DRAWINGS_STORE)
        .index('name')
        .get(name);
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (err) => {
        reject(err.target.error);
      };
    });
  }

  // List all saved drawings
  async getAllDrawings() {
    await this.ensureDBConnection();
    
    return new Promise((resolve, reject) => {
      const drawings = [];
      const request = this.db
        .transaction(DRAWINGS_STORE, 'readonly')
        .objectStore(DRAWINGS_STORE)
        .openCursor();
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor) {
          drawings.push(cursor.value);
          cursor.continue();
        } else {
          resolve(drawings);
        }
      };
      
      request.onerror = (err) => {
        reject(err.target.error);
      };
    });
  }

  // Delete a drawing by ID
  async deleteDrawing(id) {
    await this.ensureDBConnection();
    
    return new Promise((resolve, reject) => {
      const request = this.db
        .transaction(DRAWINGS_STORE, 'readwrite')
        .objectStore(DRAWINGS_STORE)
        .delete(id);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (err) => {
        reject(err.target.error);
      };
    });
  }
}

// Create and export a singleton instance
const dbService = new DatabaseService();
export default dbService;
