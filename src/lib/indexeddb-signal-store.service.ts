import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { IndexedDBService } from './indexeddb.service';

/**
 * Signal-based store wrapper for IndexedDB
 * Provides reactive data access using Angular signals
 */
@Injectable()
export class IndexedDBSignalStore<T> {
  private readonly indexedDB = inject(IndexedDBService);

  private readonly _data = signal<T[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<Error | null>(null);

  // Public readonly signals
  readonly data = this._data.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isEmpty = computed(() => this._data().length === 0);
  readonly count = computed(() => this._data().length);
  private autoSyncEffectInitialized = false;

  constructor(private readonly storeName: string) {
    // Effect will be initialized lazily when needed within injection context
  }

  /**
   * Initialize auto-sync effect (called within injection context)
   */
  private initializeAutoSyncEffect(): void {
    if (this.autoSyncEffectInitialized) {
      return;
    }

    try {
      effect(() => {
        if (this.indexedDB.isConnected()) {
          this.refresh();
        }
      });
      this.autoSyncEffectInitialized = true;
    } catch {
      // Effect initialization failed (not in injection context)
      // This is fine - users can manually call refresh()
    }
  }

  /**
   * Refresh data from IndexedDB
   */
  async refresh(): Promise<void> {
    // Try to initialize auto-sync effect if in injection context
    this.initializeAutoSyncEffect();

    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await this.indexedDB.getAll<T>(this.storeName);
      this._data.set(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this._error.set(error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Get a single item by key
   */
  async get(key: IDBValidKey): Promise<T | undefined> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const item = await this.indexedDB.get<T>(this.storeName, key);
      return item;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this._error.set(error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Add or update an item
   */
  async put(value: T, key?: IDBValidKey): Promise<IDBValidKey> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const resultKey = await this.indexedDB.put<T>(this.storeName, value, key);
      // Refresh data after update
      await this.refresh();
      return resultKey;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this._error.set(error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Delete an item
   */
  async delete(key: IDBValidKey): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.indexedDB.delete(this.storeName, key);
      // Refresh data after delete
      await this.refresh();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this._error.set(error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Clear all items
   */
  async clear(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.indexedDB.clear(this.storeName);
      this._data.set([]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this._error.set(error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Find items by predicate
   */
  find(predicate: (item: T) => boolean): T | undefined {
    return this._data().find(predicate);
  }

  /**
   * Filter items by predicate
   */
  filter(predicate: (item: T) => boolean): T[] {
    return this._data().filter(predicate);
  }

  /**
   * Get computed filtered data
   */
  createFilteredSignal(predicate: (item: T) => boolean) {
    return computed(() => this._data().filter(predicate));
  }

  /**
   * Serialize current store state for SSR hydration
   * Returns the current data as a plain array
   */
  serializeState(): T[] {
    return [...this._data()];
  }

  /**
   * Restore state from serialized data (for SSR hydration)
   * This should be called after refresh() in the browser
   */
  async restoreState(data: T[]): Promise<void> {
    if (!this.indexedDB.isAvailable() || !this.indexedDB.isConnected()) {
      // On server or not connected, just set the data signal
      this._data.set(data);
      return;
    }

    try {
      // Clear existing data
      await this.clear();

      // Restore data
      for (const item of data) {
        await this.put(item);
      }
    } catch (err) {
      console.warn(`Failed to restore state for store ${this.storeName}:`, err);
      // Fallback: just set the data signal
      this._data.set(data);
    }
  }

  /**
   * Set data directly (useful for SSR hydration without IndexedDB)
   * This bypasses IndexedDB and just sets the signal
   */
  setData(data: T[]): void {
    this._data.set(data);
  }
}
