/**
 * IndexedDB Storage Utility for BlueprintAI
 * Replaces localStorage for better performance with large data
 */

const DB_NAME = 'BlueprintAI_DB';
const DB_VERSION = 1;
const STORES = {
  PRD_DRAFTS: 'prd_drafts',
  TEMPLATES: 'templates',
  SETTINGS: 'settings'
};

class IDBStorage {
  private db: IDBDatabase | null = null;
  private openPromise: Promise<IDBDatabase> | null = null;

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.openPromise) return this.openPromise;

    this.openPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.PRD_DRAFTS)) {
          const prdStore = db.createObjectStore(STORES.PRD_DRAFTS, { keyPath: 'id' });
          prdStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          prdStore.createIndex('productName', 'productName', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.TEMPLATES)) {
          const templateStore = db.createObjectStore(STORES.TEMPLATES, { keyPath: 'id' });
          templateStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
      };
    });

    return this.openPromise;
  }

  async set(storeName: string, key: string, value: any): Promise<void> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const data = { id: key, ...value, updatedAt: new Date().toISOString() };
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async keys(storeName: string): Promise<string[]> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const idbStorage = new IDBStorage();

// Type-safe helpers for PRD drafts
export interface PRDDraft {
  id: string;
  productName: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export const prdStorage = {
  async save(draft: PRDDraft): Promise<void> {
    await idbStorage.set(STORES.PRD_DRAFTS, draft.id, draft);
  },

  async load(id: string): Promise<PRDDraft | null> {
    return idbStorage.get<PRDDraft>(STORES.PRD_DRAFTS, id);
  },

  async list(): Promise<PRDDraft[]> {
    return idbStorage.getAll<PRDDraft>(STORES.PRD_DRAFTS);
  },

  async delete(id: string): Promise<void> {
    await idbStorage.delete(STORES.PRD_DRAFTS, id);
  },

  async clear(): Promise<void> {
    await idbStorage.clear(STORES.PRD_DRAFTS);
  }
};

// Type-safe helpers for templates
export interface Template {
  id: string;
  name: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export const templateStorage = {
  async save(template: Template): Promise<void> {
    await idbStorage.set(STORES.TEMPLATES, template.id, template);
  },

  async load(id: string): Promise<Template | null> {
    return idbStorage.get<Template>(STORES.TEMPLATES, id);
  },

  async list(): Promise<Template[]> {
    return idbStorage.getAll<Template>(STORES.TEMPLATES);
  },

  async delete(id: string): Promise<void> {
    await idbStorage.delete(STORES.TEMPLATES, id);
  }
};

// Settings storage
export const settingsStorage = {
  async set<T>(key: string, value: T): Promise<void> {
    await idbStorage.set(STORES.SETTINGS, key, { value });
  },

  async get<T>(key: string): Promise<T | null> {
    const result = await idbStorage.get<{ value: T }>(STORES.SETTINGS, key);
    return result?.value || null;
  }
};

export default idbStorage;
