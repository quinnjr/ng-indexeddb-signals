import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { IndexedDBService, IndexedDBConfig } from './indexeddb.service';

// Mock IndexedDB
class MockIDBRequest {
  onsuccess: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onupgradeneeded: ((event: IDBVersionChangeEvent) => void) | null = null;
  result: any = null;
  error: DOMException | null = null;

  constructor(public resultValue?: any) {
    if (resultValue !== undefined) {
      this.result = resultValue;
    }
  }

  simulateSuccess(value?: any) {
    if (value !== undefined) {
      this.result = value;
    } else if (this.resultValue !== undefined) {
      this.result = this.resultValue;
    } else {
      // Explicitly set to undefined if no value provided
      this.result = undefined;
    }
    if (this.onsuccess) {
      this.onsuccess(new Event('success'));
    }
  }

  simulateUpgradeNeeded(db: any) {
    if (this.onupgradeneeded) {
      const event = {
        target: { result: db },
        newVersion: db.version,
        oldVersion: 0,
      } as unknown as IDBVersionChangeEvent;
      this.onupgradeneeded(event);
    }
  }

  simulateError(message: string) {
    this.error = new DOMException(message);
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

class MockIDBObjectStore {
  indexes: string[] = [];
  indexNames: DOMStringList;

  constructor(public name: string) {
    this.indexNames = {
      contains: (name: string) => this.indexes.includes(name),
      length: this.indexes.length,
      item: (index: number) => this.indexes[index] || '',
      [Symbol.iterator]: function* () {
        for (const idx of this.indexes) {
          yield idx;
        }
      },
    } as DOMStringList;
  }

  get(_key: IDBValidKey): MockIDBRequest {
    return new MockIDBRequest();
  }

  getAll(_range?: IDBKeyRange, _limit?: number): MockIDBRequest {
    return new MockIDBRequest([]);
  }

  put(_value: any, key?: IDBValidKey): MockIDBRequest {
    return new MockIDBRequest(key || 1);
  }

  delete(_key: IDBValidKey): MockIDBRequest {
    return new MockIDBRequest();
  }

  clear(): MockIDBRequest {
    return new MockIDBRequest();
  }

  count(_range?: IDBKeyRange): MockIDBRequest {
    return new MockIDBRequest(0);
  }

  createIndex(name: string, _keyPath: string | string[], _options?: IDBIndexParameters): IDBIndex {
    this.indexes.push(name);
    (this.indexNames as any).length = this.indexes.length;
    return {} as IDBIndex;
  }

  index(_name: string): IDBIndex {
    return {} as IDBIndex;
  }
}

class MockIDBTransaction {
  objectStore(name: string): MockIDBObjectStore {
    return new MockIDBObjectStore(name);
  }
}

class MockIDBDatabase {
  objectStoreNames: DOMStringList;
  version: number = 1;

  constructor(
    public name: string,
    public versionNum: number
  ) {
    this.version = versionNum;
    this.objectStoreNames = {
      contains: (_name: string) => false,
      length: 0,
      item: (_index: number) => '',
      [Symbol.iterator]: function* () {},
    } as DOMStringList;
  }

  transaction(_storeNames: string | string[], _mode?: IDBTransactionMode): MockIDBTransaction {
    return new MockIDBTransaction();
  }

  createObjectStore(name: string, _options?: IDBObjectStoreParameters): MockIDBObjectStore {
    (this.objectStoreNames as any).length++;
    return new MockIDBObjectStore(name);
  }

  deleteObjectStore(_name: string): void {
    (this.objectStoreNames as any).length--;
  }

  close(): void {}
}

describe('IndexedDBService', () => {
  let service: IndexedDBService;
  let mockOpenRequest: MockIDBRequest;
  let mockDB: MockIDBDatabase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IndexedDBService, provideZonelessChangeDetection()],
    });
    service = TestBed.inject(IndexedDBService);

    mockDB = new MockIDBDatabase('test-db', 1);
    mockOpenRequest = new MockIDBRequest(mockDB);

    // Mock indexedDB.open
    global.indexedDB = {
      open: vi.fn(() => mockOpenRequest as any),
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with config', async () => {
      const config: IndexedDBConfig = {
        name: 'test-db',
        version: 1,
        stores: [
          {
            name: 'test-store',
            keyPath: 'id',
            autoIncrement: true,
          },
        ],
      };

      const initPromise = service.initialize(config);
      mockOpenRequest.simulateSuccess();

      await initPromise;

      expect(service.isConnected()).toBe(true);
      expect(service.connectionState()).toBe('open');
    });

    it('should handle initialization errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const config: IndexedDBConfig = {
        name: 'test-db',
        version: 1,
        stores: [{ name: 'test-store' }],
      };

      const initPromise = service.initialize(config);
      mockOpenRequest.simulateError('Database error');

      await expect(initPromise).rejects.toThrow();
      expect(service.connectionState()).toBe('error');
      expect(service.error()).not.toBeNull();

      consoleSpy.mockRestore();
    });

    it('should handle version upgrade', async () => {
      const config: IndexedDBConfig = {
        name: 'test-db',
        version: 2,
        stores: [
          {
            name: 'test-store',
            keyPath: 'id',
            indexes: [{ name: 'name-index', keyPath: 'name' }],
          },
        ],
      };

      const upgradeDB = new MockIDBDatabase('test-db', 2);
      const mockStore = new MockIDBObjectStore('test-store');

      // Set up the mock to return the upgrade DB
      const upgradeMockRequest = new MockIDBRequest(upgradeDB);
      upgradeMockRequest.result = upgradeDB;

      // Mock the database's createObjectStore to track upgrade
      const createStoreSpy = vi.spyOn(upgradeDB, 'createObjectStore').mockReturnValue(mockStore);

      // Replace the mock for this test
      global.indexedDB = {
        open: vi.fn(() => upgradeMockRequest as any),
      } as any;

      const initPromise = service.initialize(config);
      // Simulate upgrade event first, then success
      upgradeMockRequest.simulateUpgradeNeeded(upgradeDB);
      upgradeMockRequest.simulateSuccess();

      await initPromise;

      // Verify upgrade was handled (store creation was called)
      expect(createStoreSpy).toHaveBeenCalled();
      expect(service.isConnected()).toBe(true);
    });

    it('should handle upgrade with existing stores', async () => {
      const config: IndexedDBConfig = {
        name: 'test-db',
        version: 2,
        stores: [
          {
            name: 'test-store',
            keyPath: 'id',
          },
          {
            name: 'new-store',
            keyPath: 'id',
          },
        ],
      };

      const mockDB = new MockIDBDatabase('test-db', 1);
      (mockDB.objectStoreNames as any).contains = (name: string) => name === 'test-store';
      (mockDB.objectStoreNames as any).length = 1;

      mockOpenRequest.onupgradeneeded = event => {
        const db = (event.target as any).result;
        if (!db.objectStoreNames.contains('new-store')) {
          db.createObjectStore('new-store', { keyPath: 'id' });
        }
      };

      const initPromise = service.initialize(config);
      mockOpenRequest.simulateSuccess();

      await initPromise;

      expect(service.isConnected()).toBe(true);
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      const config: IndexedDBConfig = {
        name: 'test-db',
        version: 1,
        stores: [{ name: 'test-store' }],
      };
      const initPromise = service.initialize(config);
      mockOpenRequest.simulateSuccess();
      await initPromise;
    });

    it('should get a value from store', async () => {
      const mockGetRequest = new MockIDBRequest({ id: 1, name: 'test' });

      vi.spyOn(MockIDBTransaction.prototype, 'objectStore').mockReturnValue({
        get: () => mockGetRequest,
      } as any);

      const getPromise = service.get('test-store', 1);
      mockGetRequest.simulateSuccess({ id: 1, name: 'test' });

      const result = await getPromise;
      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('should return undefined for non-existent key', async () => {
      const mockGetRequest = new MockIDBRequest();

      vi.spyOn(MockIDBTransaction.prototype, 'objectStore').mockReturnValue({
        get: () => mockGetRequest,
      } as any);

      const getPromise = service.get('test-store', 999);
      // Don't set result, so it remains undefined
      mockGetRequest.simulateSuccess();

      const result = await getPromise;
      expect(result).toBeUndefined();
    });

    it('should throw error if database not initialized', async () => {
      const newService = new IndexedDBService();
      await expect(newService.get('test-store', 1)).rejects.toThrow('Database not initialized');
    });

    it('should handle get errors', async () => {
      const mockGetRequest = new MockIDBRequest();

      vi.spyOn(MockIDBTransaction.prototype, 'objectStore').mockReturnValue({
        get: () => mockGetRequest,
      } as any);

      const getPromise = service.get('test-store', 1);
      mockGetRequest.simulateError('Get failed');

      await expect(getPromise).rejects.toThrow('Failed to get value');
    });
  });

  describe('getAll', () => {
    beforeEach(async () => {
      const config: IndexedDBConfig = {
        name: 'test-db',
        version: 1,
        stores: [{ name: 'test-store' }],
      };
      const initPromise = service.initialize(config);
      mockOpenRequest.simulateSuccess();
      await initPromise;
    });

    it('should get all values from store', async () => {
      const mockData = [{ id: 1 }, { id: 2 }];
      const mockGetAllRequest = new MockIDBRequest(mockData);

      vi.spyOn(MockIDBTransaction.prototype, 'objectStore').mockReturnValue({
        getAll: () => mockGetAllRequest,
      } as any);

      const getAllPromise = service.getAll('test-store');
      mockGetAllRequest.simulateSuccess(mockData);

      const result = await getAllPromise;
      expect(result).toEqual(mockData);
    });

    it('should get all values with index', async () => {
      const mockData = [{ id: 1 }];
      const mockGetAllRequest = new MockIDBRequest(mockData);
      const mockIndex = { getAll: () => mockGetAllRequest };

      vi.spyOn(MockIDBTransaction.prototype, 'objectStore').mockReturnValue({
        index: () => mockIndex,
      } as any);

      const getAllPromise = service.getAll('test-store', { index: 'name-index' });
      mockGetAllRequest.simulateSuccess(mockData);

      const result = await getAllPromise;
      expect(result).toEqual(mockData);
    });

    it('should get all values with range and limit', async () => {
      const mockData = [{ id: 1 }];
      const mockGetAllRequest = new MockIDBRequest(mockData);
      // Mock IDBKeyRange since it's not available in test environment
      const range = { lower: 1, upper: 10 } as IDBKeyRange;

      vi.spyOn(MockIDBTransaction.prototype, 'objectStore').mockReturnValue({
        getAll: () => mockGetAllRequest,
      } as any);

      const getAllPromise = service.getAll('test-store', { range, limit: 5 });
      mockGetAllRequest.simulateSuccess(mockData);

      const result = await getAllPromise;
      expect(result).toEqual(mockData);
    });

    it('should handle getAll errors', async () => {
      const mockGetAllRequest = new MockIDBRequest();

      vi.spyOn(MockIDBTransaction.prototype, 'objectStore').mockReturnValue({
        getAll: () => mockGetAllRequest,
      } as any);

      const getAllPromise = service.getAll('test-store');
      mockGetAllRequest.simulateError('GetAll failed');

      await expect(getAllPromise).rejects.toThrow('Failed to get all values');
    });
  });

  describe('put', () => {
    beforeEach(async () => {
      const config: IndexedDBConfig = {
        name: 'test-db',
        version: 1,
        stores: [{ name: 'test-store', keyPath: 'id' }],
      };
      const initPromise = service.initialize(config);
      mockOpenRequest.simulateSuccess();
      await initPromise;
    });

    it('should put a value into store', async () => {
      const mockPutRequest = new MockIDBRequest(1);

      vi.spyOn(MockIDBTransaction.prototype, 'objectStore').mockReturnValue({
        put: () => mockPutRequest,
      } as any);

      const putPromise = service.put('test-store', { id: 1, name: 'test' });
      mockPutRequest.simulateSuccess(1);

      const result = await putPromise;
      expect(result).toBe(1);
    });

    it('should put a value with explicit key', async () => {
      const mockPutRequest = new MockIDBRequest(2);

      vi.spyOn(MockIDBTransaction.prototype, 'objectStore').mockReturnValue({
        put: () => mockPutRequest,
      } as any);

      const putPromise = service.put('test-store', { name: 'test' }, 2);
      mockPutRequest.simulateSuccess(2);

      const result = await putPromise;
      expect(result).toBe(2);
    });

    it('should handle put errors', async () => {
      const mockPutRequest = new MockIDBRequest();

      vi.spyOn(MockIDBTransaction.prototype, 'objectStore').mockReturnValue({
        put: () => mockPutRequest,
      } as any);

      const putPromise = service.put('test-store', { id: 1, name: 'test' });
      mockPutRequest.simulateError('Put failed');

      await expect(putPromise).rejects.toThrow('Failed to put value');
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      const config: IndexedDBConfig = {
        name: 'test-db',
        version: 1,
        stores: [{ name: 'test-store' }],
      };
      const initPromise = service.initialize(config);
      mockOpenRequest.simulateSuccess();
      await initPromise;
    });

    it('should delete a value from store', async () => {
      const mockDeleteRequest = new MockIDBRequest();

      vi.spyOn(MockIDBTransaction.prototype, 'objectStore').mockReturnValue({
        delete: () => mockDeleteRequest,
      } as any);

      const deletePromise = service.delete('test-store', 1);
      mockDeleteRequest.simulateSuccess();

      // Delete operation succeeds if promise resolves without error
      await expect(deletePromise).resolves.toBeUndefined();
    });

    it('should handle delete errors', async () => {
      const mockDeleteRequest = new MockIDBRequest();

      vi.spyOn(MockIDBTransaction.prototype, 'objectStore').mockReturnValue({
        delete: () => mockDeleteRequest,
      } as any);

      const deletePromise = service.delete('test-store', 1);
      mockDeleteRequest.simulateError('Delete failed');

      await expect(deletePromise).rejects.toThrow('Failed to delete value');
    });
  });

  describe('clear', () => {
    beforeEach(async () => {
      const config: IndexedDBConfig = {
        name: 'test-db',
        version: 1,
        stores: [{ name: 'test-store' }],
      };
      const initPromise = service.initialize(config);
      mockOpenRequest.simulateSuccess();
      await initPromise;
    });

    it('should clear all values from store', async () => {
      const mockClearRequest = new MockIDBRequest();

      vi.spyOn(MockIDBTransaction.prototype, 'objectStore').mockReturnValue({
        clear: () => mockClearRequest,
      } as any);

      const clearPromise = service.clear('test-store');
      mockClearRequest.simulateSuccess();

      // Clear operation succeeds if promise resolves without error
      await expect(clearPromise).resolves.toBeUndefined();
    });

    it('should handle clear errors', async () => {
      const mockClearRequest = new MockIDBRequest();

      vi.spyOn(MockIDBTransaction.prototype, 'objectStore').mockReturnValue({
        clear: () => mockClearRequest,
      } as any);

      const clearPromise = service.clear('test-store');
      mockClearRequest.simulateError('Clear failed');

      await expect(clearPromise).rejects.toThrow('Failed to clear store');
    });
  });

  describe('count', () => {
    beforeEach(async () => {
      const config: IndexedDBConfig = {
        name: 'test-db',
        version: 1,
        stores: [{ name: 'test-store' }],
      };
      const initPromise = service.initialize(config);
      mockOpenRequest.simulateSuccess();
      await initPromise;
    });

    it('should count records in store', async () => {
      const mockCountRequest = new MockIDBRequest(5);

      vi.spyOn(MockIDBTransaction.prototype, 'objectStore').mockReturnValue({
        count: () => mockCountRequest,
      } as any);

      const countPromise = service.count('test-store');
      mockCountRequest.simulateSuccess(5);

      const result = await countPromise;
      expect(result).toBe(5);
    });

    it('should count records with range', async () => {
      const mockCountRequest = new MockIDBRequest(3);
      // Mock IDBKeyRange since it's not available in test environment
      const range = { lower: 1, upper: 10 } as IDBKeyRange;

      vi.spyOn(MockIDBTransaction.prototype, 'objectStore').mockReturnValue({
        count: () => mockCountRequest,
      } as any);

      const countPromise = service.count('test-store', range);
      mockCountRequest.simulateSuccess(3);

      const result = await countPromise;
      expect(result).toBe(3);
    });

    it('should handle count errors', async () => {
      const mockCountRequest = new MockIDBRequest();

      vi.spyOn(MockIDBTransaction.prototype, 'objectStore').mockReturnValue({
        count: () => mockCountRequest,
      } as any);

      const countPromise = service.count('test-store');
      mockCountRequest.simulateError('Count failed');

      await expect(countPromise).rejects.toThrow('Failed to count records');
    });
  });

  describe('close', () => {
    beforeEach(async () => {
      const config: IndexedDBConfig = {
        name: 'test-db',
        version: 1,
        stores: [{ name: 'test-store' }],
      };
      const initPromise = service.initialize(config);
      mockOpenRequest.simulateSuccess();
      await initPromise;
    });

    it('should close database connection', () => {
      const db = service.getDatabase();
      const closeSpy = vi.spyOn(db!, 'close');

      service.close();

      expect(closeSpy).toHaveBeenCalled();
      expect(service.connectionState()).toBe('closed');
      expect(service.getDatabase()).toBeNull();
    });

    it('should handle close when database is null', () => {
      const newService = new IndexedDBService();
      expect(() => newService.close()).not.toThrow();
    });
  });

  describe('error handling for uninitialized database', () => {
    it('should throw error for getAll when not initialized', async () => {
      const newService = new IndexedDBService();
      await expect(newService.getAll('test-store')).rejects.toThrow('Database not initialized');
    });

    it('should throw error for put when not initialized', async () => {
      const newService = new IndexedDBService();
      await expect(newService.put('test-store', { id: 1 })).rejects.toThrow(
        'Database not initialized'
      );
    });

    it('should throw error for delete when not initialized', async () => {
      const newService = new IndexedDBService();
      await expect(newService.delete('test-store', 1)).rejects.toThrow('Database not initialized');
    });

    it('should throw error for clear when not initialized', async () => {
      const newService = new IndexedDBService();
      await expect(newService.clear('test-store')).rejects.toThrow('Database not initialized');
    });

    it('should throw error for count when not initialized', async () => {
      const newService = new IndexedDBService();
      await expect(newService.count('test-store')).rejects.toThrow('Database not initialized');
    });
  });

  describe('signals', () => {
    it('should expose connection state signal', () => {
      expect(service.connectionState()).toBe('closed');
    });

    it('should expose isConnected computed signal', () => {
      expect(service.isConnected()).toBe(false);
    });

    it('should expose isConnecting computed signal', () => {
      expect(service.isConnecting()).toBe(false);
    });

    it('should expose error signal', () => {
      expect(service.error()).toBeNull();
    });

    it('should update isConnected when state changes', async () => {
      expect(service.isConnected()).toBe(false);

      const config: IndexedDBConfig = {
        name: 'test-db',
        version: 1,
        stores: [{ name: 'test-store' }],
      };

      const initPromise = service.initialize(config);
      expect(service.isConnecting()).toBe(true);

      mockOpenRequest.simulateSuccess();
      await initPromise;

      expect(service.isConnected()).toBe(true);
      expect(service.isConnecting()).toBe(false);
    });
  });

  describe('effect error handling', () => {
    it('should log error when connection state is error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const config: IndexedDBConfig = {
        name: 'test-db',
        version: 1,
        stores: [{ name: 'test-store' }],
      };

      const initPromise = service.initialize(config);
      mockOpenRequest.simulateError('Test error');

      await expect(initPromise).rejects.toThrow();

      // Wait for effect to run
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

});
