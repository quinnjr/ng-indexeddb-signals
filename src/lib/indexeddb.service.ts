import { Injectable, signal, effect, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface IndexedDBConfig {
  name: string;
  version: number;
  stores: StoreConfig[];
}

export interface StoreConfig {
  name: string;
  keyPath?: string | string[];
  autoIncrement?: boolean;
  indexes?: IndexConfig[];
}

export interface IndexConfig {
  name: string;
  keyPath: string | string[];
  unique?: boolean;
}

export interface QueryOptions {
  index?: string;
  range?: IDBKeyRange;
  direction?: IDBCursorDirection;
  limit?: number;
}

/**
 * Serialized state for SSR hydration
 */
export interface IndexedDBState {
  stores: Record<string, unknown[]>;
  connectionState: 'opening' | 'open' | 'closed' | 'error';
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class IndexedDBService {
  // Signals for connection state
  private readonly _connectionState = signal<'opening' | 'open' | 'closed' | 'error'>('closed');
  private readonly _error = signal<Error | null>(null);
  private readonly _db = signal<IDBDatabase | null>(null);

  // Public readonly signals
  readonly connectionState = this._connectionState.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isConnected = computed(() => this._connectionState() === 'open');
  readonly isConnecting = computed(() => this._connectionState() === 'opening');

  private config: IndexedDBConfig | null = null;
  private errorEffectInitialized = false;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  constructor() {
    // Effect will be initialized lazily when needed within injection context
  }

  /**
   * Check if IndexedDB is available (browser environment)
   */
  isAvailable(): boolean {
    return this.isBrowser && typeof indexedDB !== 'undefined';
  }

  /**
   * Initialize error effect (called within injection context)
   */
  private initializeErrorEffect(): void {
    if (this.errorEffectInitialized) {
      return;
    }

    try {
      effect(() => {
        const state = this._connectionState();
        if (state === 'error') {
          console.error('IndexedDB connection error:', this._error());
        }
      });
      this.errorEffectInitialized = true;
    } catch {
      // Effect initialization failed (not in injection context)
      // This is fine - we'll handle errors manually
    }
  }

  /**
   * Initialize IndexedDB with configuration
   * On server (SSR), this will set state to 'closed' without error
   */
  async initialize(config: IndexedDBConfig): Promise<void> {
    this.config = config;

    // On server, IndexedDB is not available - gracefully handle
    if (!this.isAvailable()) {
      this._connectionState.set('closed');
      this._error.set(null);
      return;
    }

    this._connectionState.set('opening');
    this._error.set(null);

    // Try to initialize error effect if in injection context
    this.initializeErrorEffect();

    try {
      const db = await this.openDatabase(config);
      this._db.set(db);
      this._connectionState.set('open');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this._error.set(error);
      this._connectionState.set('error');
      // Manually log error if effect isn't available
      if (!this.errorEffectInitialized) {
        console.error('IndexedDB connection error:', error);
      }
      throw error;
    }
  }

  /**
   * Open database and handle version upgrades
   */
  private openDatabase(config: IndexedDBConfig): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(config.name, config.version);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Remove old stores if they exist
        const existingStores = Array.from(db.objectStoreNames);
        existingStores.forEach(storeName => {
          if (!config.stores.some(s => s.name === storeName)) {
            db.deleteObjectStore(storeName);
          }
        });

        // Create or update stores
        config.stores.forEach(storeConfig => {
          let store: IDBObjectStore;

          if (db.objectStoreNames.contains(storeConfig.name)) {
            store = (event.target as IDBTransaction).objectStore(storeConfig.name);
          } else {
            store = db.createObjectStore(storeConfig.name, {
              keyPath: storeConfig.keyPath,
              autoIncrement: storeConfig.autoIncrement,
            });
          }

          // Create or update indexes
          if (storeConfig.indexes) {
            storeConfig.indexes.forEach(indexConfig => {
              if (!store.indexNames.contains(indexConfig.name)) {
                store.createIndex(indexConfig.name, indexConfig.keyPath, {
                  unique: indexConfig.unique ?? false,
                });
              }
            });
          }
        });
      };
    });
  }

  /**
   * Get a value from a store
   */
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = this._db();
    if (!db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => {
        reject(new Error(`Failed to get value: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve(request.result as T | undefined);
      };
    });
  }

  /**
   * Get all values from a store
   */
  async getAll<T>(storeName: string, options?: QueryOptions): Promise<T[]> {
    const db = this._db();
    if (!db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      let source: IDBObjectStore | IDBIndex = store;
      if (options?.index) {
        source = store.index(options.index);
      }

      const request = source.getAll(options?.range, options?.limit);

      request.onerror = () => {
        reject(new Error(`Failed to get all values: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve(request.result as T[]);
      };
    });
  }

  /**
   * Put a value into a store
   */
  async put<T>(storeName: string, value: T, key?: IDBValidKey): Promise<IDBValidKey> {
    const db = this._db();
    if (!db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = key !== undefined ? store.put(value, key) : store.put(value);

      request.onerror = () => {
        reject(new Error(`Failed to put value: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  /**
   * Delete a value from a store
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = this._db();
    if (!db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => {
        reject(new Error(`Failed to delete value: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Clear all values from a store
   */
  async clear(storeName: string): Promise<void> {
    const db = this._db();
    if (!db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => {
        reject(new Error(`Failed to clear store: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Count records in a store
   */
  async count(storeName: string, range?: IDBKeyRange): Promise<number> {
    const db = this._db();
    if (!db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count(range);

      request.onerror = () => {
        reject(new Error(`Failed to count records: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    const db = this._db();
    if (db) {
      db.close();
      this._db.set(null);
      this._connectionState.set('closed');
    }
  }

  /**
   * Get the database instance (for advanced usage)
   */
  getDatabase(): IDBDatabase | null {
    return this._db();
  }

  /**
   * Serialize current IndexedDB state for SSR hydration
   * Returns state of all configured stores
   */
  async serializeState(): Promise<IndexedDBState | null> {
    if (!this.isAvailable() || !this.isConnected()) {
      return null;
    }

    const db = this._db();
    if (!db || !this.config) {
      return null;
    }

    const stores: Record<string, unknown[]> = {};

    // Serialize all configured stores
    for (const storeConfig of this.config.stores) {
      try {
        const data = await this.getAll(storeConfig.name);
        stores[storeConfig.name] = data;
      } catch {
        // If store doesn't exist or error, use empty array
        stores[storeConfig.name] = [];
      }
    }

    return {
      stores,
      connectionState: this._connectionState(),
      error: this._error()?.message,
    };
  }

  /**
   * Restore state from serialized data (for SSR hydration)
   * This should be called after initialize() in the browser
   */
  async restoreState(state: IndexedDBState): Promise<void> {
    if (!this.isAvailable() || !this.isConnected()) {
      return;
    }

    const db = this._db();
    if (!db) {
      return;
    }

    // Restore data to stores
    for (const [storeName, data] of Object.entries(state.stores)) {
      try {
        // Clear existing data
        await this.clear(storeName);

        // Restore data
        for (const item of data) {
          await this.put(storeName, item);
        }
      } catch (err) {
        console.warn(`Failed to restore state for store ${storeName}:`, err);
      }
    }
  }

  /**
   * Get serializable state for a specific store
   * Useful for SSR when you only need one store's data
   */
  async serializeStoreState(storeName: string): Promise<unknown[] | null> {
    if (!this.isAvailable() || !this.isConnected()) {
      return null;
    }

    try {
      return await this.getAll(storeName);
    } catch {
      return null;
    }
  }
}
