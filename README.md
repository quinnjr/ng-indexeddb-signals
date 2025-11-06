# ng-indexeddb-signals

An Angular 20+ module for encapsulating IndexedDB in the browser with a signal-based API. This library provides a reactive, type-safe interface to IndexedDB using Angular signals, effects, and computed values instead of event-based approaches.

## Features

- ✅ **Signal-based API** - Uses Angular signals, effects, and computed values
- ✅ **Type-safe** - Full TypeScript support with generics
- ✅ **Reactive** - Automatic data synchronization with signals
- ✅ **Comprehensive testing** - 85%+ test coverage with unit and e2e tests
- ✅ **Angular 20+** - Built for modern Angular with standalone components

## Installation

```bash
pnpm install ng-indexeddb-signals
```

## Quick Start

### 1. Initialize the Service

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { IndexedDBService } from 'ng-indexeddb-signals';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `...`,
})
export class AppComponent implements OnInit {
  private readonly indexedDB = inject(IndexedDBService);

  async ngOnInit() {
    await this.indexedDB.initialize({
      name: 'my-database',
      version: 1,
      stores: [
        {
          name: 'users',
          keyPath: 'id',
          autoIncrement: true,
          indexes: [{ name: 'email', keyPath: 'email', unique: true }],
        },
      ],
    });
  }
}
```

### 2. Use Signal Store for Reactive Data

```typescript
import { IndexedDBSignalStore } from 'ng-indexeddb-signals';

@Component({
  providers: [
    {
      provide: IndexedDBSignalStore,
      useFactory: () => new IndexedDBSignalStore<User>('users'),
    },
  ],
})
export class UserComponent {
  readonly userStore = inject(IndexedDBSignalStore<User>);

  // Reactive signals
  readonly users = this.userStore.data;
  readonly loading = this.userStore.loading;
  readonly isEmpty = this.userStore.isEmpty;
  readonly count = this.userStore.count;

  async addUser(user: User) {
    await this.userStore.put(user);
  }

  async deleteUser(id: number) {
    await this.userStore.delete(id);
  }
}
```

### 3. Use in Template

```html
<div *ngIf="loading()">Loading...</div>
<div *ngIf="isEmpty()">No users found</div>
<div *ngFor="let user of users()">{{ user.name }} - {{ user.email }}</div>
```

## API Reference

### IndexedDBService

Main service for IndexedDB operations.

#### Methods

- `initialize(config: IndexedDBConfig): Promise<void>` - Initialize the database
- `get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined>` - Get a single item
- `getAll<T>(storeName: string, options?: QueryOptions): Promise<T[]>` - Get all items
- `put<T>(storeName: string, value: T, key?: IDBValidKey): Promise<IDBValidKey>` - Add/update an item
- `delete(storeName: string, key: IDBValidKey): Promise<void>` - Delete an item
- `clear(storeName: string): Promise<void>` - Clear all items in a store
- `count(storeName: string, range?: IDBKeyRange): Promise<number>` - Count items
- `close(): void` - Close the database connection

#### Signals

- `connectionState: Signal<'opening' | 'open' | 'closed' | 'error'>` - Current connection state
- `isConnected: Signal<boolean>` - Whether database is connected
- `isConnecting: Signal<boolean>` - Whether database is connecting
- `error: Signal<Error | null>` - Current error, if any

### IndexedDBSignalStore<T>

Reactive store wrapper with signal-based API.

#### Methods

- `refresh(): Promise<void>` - Refresh data from IndexedDB
- `get(key: IDBValidKey): Promise<T | undefined>` - Get a single item
- `put(value: T, key?: IDBValidKey): Promise<IDBValidKey>` - Add/update an item
- `delete(key: IDBValidKey): Promise<void>` - Delete an item
- `clear(): Promise<void>` - Clear all items
- `find(predicate: (item: T) => boolean): T | undefined` - Find item by predicate
- `filter(predicate: (item: T) => boolean): T[]` - Filter items
- `createFilteredSignal(predicate: (item: T) => boolean): Signal<T[]>` - Create computed filtered signal

#### Signals

- `data: Signal<T[]>` - All items in the store
- `loading: Signal<boolean>` - Whether an operation is in progress
- `error: Signal<Error | null>` - Current error, if any
- `isEmpty: Signal<boolean>` - Whether store is empty
- `count: Signal<number>` - Number of items

## Testing

### Unit Tests

```bash
pnpm test
```

### Coverage

```bash
pnpm test:coverage
```

### E2E Tests

```bash
pnpm e2e
```

## License

MIT
