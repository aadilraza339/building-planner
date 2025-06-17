/**
 * Mock implementation of IndexedDB for testing
 */

// Custom event class for our mock that allows setting target
class MockEvent {
  constructor(type) {
    this.type = type;
    this._target = null;
    this._defaultPrevented = false;
  }
  
  get target() {
    return this._target;
  }
  
  set target(value) {
    this._target = value;
  }
  
  preventDefault() {
    this._defaultPrevented = true;
  }
  
  get defaultPrevented() {
    return this._defaultPrevented;
  }
}

export class IndexedDBMock {
  constructor() {
    this.databases = new Map();
    this.stores = new Map();
    this.data = new Map();
  }

  // Setup global mock
  static setup() {
    const mockDB = new IndexedDBMock();
    
    // Save original indexedDB if it exists
    if (typeof globalThis.originalIndexedDB === 'undefined') {
      globalThis.originalIndexedDB = globalThis.indexedDB;
    }
    
    // Mock indexedDB API
    globalThis.indexedDB = {
      open: mockDB.open.bind(mockDB),
      deleteDatabase: mockDB.deleteDatabase.bind(mockDB),
      _mock: mockDB // For test access
    };
    
    return mockDB;
  }

  // Restore original implementation
  static restore() {
    if (typeof globalThis.originalIndexedDB !== 'undefined') {
      globalThis.indexedDB = globalThis.originalIndexedDB;
      delete globalThis.originalIndexedDB;
    }
  }

  open(name, version) {
    const request = new EventTarget();
    
    setTimeout(() => {
      if (!this.databases.has(name)) {
        this.databases.set(name, { name, version, objectStoreNames: [] });
        this.stores.set(name, new Map());
        this.data.set(name, new Map());
        
        const event = new MockEvent('upgradeneeded');
        event.target = { result: this._createDBConnection(name) };
        request.dispatchEvent(event);
      }
      
      const event = new MockEvent('success');
      event.target = { result: this._createDBConnection(name) };
      request.dispatchEvent(event);
    }, 0);
    
    return request;
  }

  deleteDatabase(name) {
    const request = new EventTarget();
    
    setTimeout(() => {
      this.databases.delete(name);
      this.stores.delete(name);
      this.data.delete(name);
      
      const event = new MockEvent('success');
      request.dispatchEvent(event);
    }, 0);
    
    return request;
  }

  _createDBConnection(dbName) {
    const db = this.databases.get(dbName);
    const dbStores = this.stores.get(dbName);
    const dbData = this.data.get(dbName);
    
    return {
      name: db.name,
      version: db.version,
      objectStoreNames: {
        contains: (name) => db.objectStoreNames.includes(name)
      },
      
      createObjectStore: (name, { keyPath }) => {
        db.objectStoreNames.push(name);
        dbStores.set(name, { name, keyPath, indexes: {} });
        dbData.set(name, new Map());
        
        return {
          createIndex: (indexName, keyPath, { unique }) => {
            dbStores.get(name).indexes[indexName] = { name: indexName, keyPath, unique };
          }
        };
      },
      
      transaction: (storeNames, mode) => {
        return {
          objectStore: (storeName) => {
            const store = dbStores.get(storeName);
            const storeData = dbData.get(storeName);
            
            return {
              add: (item) => {
                const request = new EventTarget();
                
                setTimeout(() => {
                  try {
                    const keyValue = item[store.keyPath];
                    if (storeData.has(keyValue)) {
                      const error = new Error('Key already exists');
                      const event = new MockEvent('error');
                      event.target = { error };
                      request.dispatchEvent(event);
                      return;
                    }
                    
                    storeData.set(keyValue, { ...item });
                    const event = new MockEvent('success');
                    event.target = { result: keyValue };
                    request.dispatchEvent(event);
                  } catch (error) {
                    const event = new MockEvent('error');
                    event.target = { error };
                    request.dispatchEvent(event);
                  }
                }, 0);
                
                return request;
              },
              
              put: (item) => {
                const request = new EventTarget();
                
                setTimeout(() => {
                  try {
                    const keyValue = item[store.keyPath];
                    storeData.set(keyValue, { ...item });
                    const event = new MockEvent('success');
                    event.target = { result: keyValue };
                    request.dispatchEvent(event);
                  } catch (error) {
                    const event = new MockEvent('error');
                    event.target = { error };
                    request.dispatchEvent(event);
                  }
                }, 0);
                
                return request;
              },
              
              get: (key) => {
                const request = new EventTarget();
                
                setTimeout(() => {
                  try {
                    const item = storeData.get(key);
                    const event = new MockEvent('success');
                    event.target = { result: item ? { ...item } : undefined };
                    request.dispatchEvent(event);
                  } catch (error) {
                    const event = new MockEvent('error');
                    event.target = { error };
                    request.dispatchEvent(event);
                  }
                }, 0);
                
                return request;
              },
              
              delete: (key) => {
                const request = new EventTarget();
                
                setTimeout(() => {
                  try {
                    storeData.delete(key);
                    const event = new MockEvent('success');
                    request.dispatchEvent(event);
                  } catch (error) {
                    const event = new MockEvent('error');
                    event.target = { error };
                    request.dispatchEvent(event);
                  }
                }, 0);
                
                return request;
              },
              
              index: (indexName) => {
                const index = store.indexes[indexName];
                
                return {
                  get: (key) => {
                    const request = new EventTarget();
                    
                    setTimeout(() => {
                      try {
                        let result;
                        storeData.forEach((value) => {
                          if (value[index.keyPath] === key) {
                            result = value;
                          }
                        });
                        
                        const event = new MockEvent('success');
                        event.target = { result: result ? { ...result } : undefined };
                        request.dispatchEvent(event);
                      } catch (error) {
                        const event = new MockEvent('error');
                        event.target = { error };
                        request.dispatchEvent(event);
                      }
                    }, 0);
                    
                    return request;
                  }
                };
              },
              
              openCursor: () => {
                const request = new EventTarget();
                const entries = Array.from(storeData.entries());
                let index = 0;
                
                setTimeout(() => {
                  try {
                    const nextCursor = () => {
                      if (index < entries.length) {
                        const [key, value] = entries[index++];
                        const event = new MockEvent('success');
                        event.target = {
                          result: {
                            value: { ...value },
                            continue: () => {
                              setTimeout(nextCursor, 0);
                            }
                          }
                        };
                        request.dispatchEvent(event);
                      } else {
                        const event = new MockEvent('success');
                        event.target = { result: null };
                        request.dispatchEvent(event);
                      }
                    };
                    
                    nextCursor();
                  } catch (error) {
                    const event = new MockEvent('error');
                    event.target = { error };
                    request.dispatchEvent(event);
                  }
                }, 0);
                
                return request;
              }
            };
          }
        };
      }
    };
  }
}

// No need to extend Event since we're using our own MockEvent implementation

// EventTarget polyfill for environments that don't have it
if (typeof EventTarget === 'undefined') {
  globalThis.EventTarget = class EventTarget {
    constructor() {
      this.listeners = {};
    }
    
    addEventListener(type, callback) {
      if (!(type in this.listeners)) {
        this.listeners[type] = [];
      }
      this.listeners[type].push(callback);
    }
    
    removeEventListener(type, callback) {
      if (!(type in this.listeners)) return;
      const stack = this.listeners[type];
      for (let i = 0, l = stack.length; i < l; i++) {
        if (stack[i] === callback) {
          stack.splice(i, 1);
          return;
        }
      }
    }
    
    dispatchEvent(event) {
      if (!(event.type in this.listeners)) return true;
      const stack = this.listeners[event.type].slice();
      
      for (let i = 0, l = stack.length; i < l; i++) {
        stack[i].call(this, event);
      }
      return !event.defaultPrevented;
    }
  };
}
