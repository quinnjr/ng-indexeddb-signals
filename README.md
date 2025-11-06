# ng-indexeddb-signals

Angular 20+ module for IndexedDB with a signal-based API. This library provides a reactive, zoneless approach to managing IndexedDB operations using Angular Signals.

## Features

- 🚀 **Signal-based API** - Uses Angular Signals, Effects, and Computed properties instead of EventEmitters
- 🔄 **Reactive Store** - `IndexedDBSignalStore` for automatic synchronization between IndexedDB and signals
- 🎯 **Zoneless** - Works without Zone.js
- 🌐 **SSR Support** - Includes state serialization and restoration for server-side rendering
- ✅ **Type-safe** - Full TypeScript support
- 🧪 **Well-tested** - Comprehensive unit and E2E tests

## Installation

```bash
pnpm add ng-indexeddb-signals
# or
npm install ng-indexeddb-signals
# or
yarn add ng-indexeddb-signals
```

## Peer Dependencies

- `@angular/core`: `^20.0.0`
- `tslib`: `^2.8.1`

## Quick Start

### 1. Configure in app.config.ts (Recommended)

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideIndexedDB } from 'ng-indexeddb-signals';

export const appConfig: ApplicationConfig = {
  providers: [
    provideIndexedDB({
      name: 'my-database',
      version: 1,
      stores: [
        {
          name: 'users',
          keyPath: 'id',
          autoIncrement: true,
        },
      ],
    }),
  ],
};
```

Then in `main.ts`:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { appConfig } from './app.config';

bootstrapApplication(AppComponent, appConfig);
```

### Alternative: Initialize in Component

If you prefer to initialize manually, you can still use the service directly:

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { IndexedDBService } from 'ng-indexeddb-signals';

@Component({
  selector: 'app-root',
  standalone: true,
  // ...
})
export class AppComponent implements OnInit {
  private indexedDB = inject(IndexedDBService);

  async ngOnInit() {
    await this.indexedDB.initialize({
      name: 'my-database',
      version: 1,
      stores: [
        {
          name: 'users',
          keyPath: 'id',
          autoIncrement: true,
        },
      ],
    });
  }
}
```

### 2. Use the Reactive Store

```typescript
import { IndexedDBSignalStore } from 'ng-indexeddb-signals';

export class UserService {
  private userStore = inject(IndexedDBSignalStore<User>);

  constructor() {
    // Initialize with store name
    this.userStore = new IndexedDBSignalStore<User>('users');
  }

  // Access reactive data
  users = this.userStore.data;
  userCount = this.userStore.count;
  isLoading = this.userStore.loading;

  async loadUsers() {
    await this.userStore.refresh();
  }

  async addUser(user: User) {
    await this.userStore.put(user);
  }

  async deleteUser(id: number) {
    await this.userStore.delete(id);
  }
}
```

### 3. Use in Templates

```html
<div>
  <p>Users: {{ userService.userCount() }}</p>
  <p *ngIf="userService.isLoading()">Loading...</p>

  <ul>
    <li *ngFor="let user of userService.users()">{{ user.name }}</li>
  </ul>
</div>
```

## API Reference

### IndexedDBService

#### Methods

- `initialize(config: IndexedDBConfig): Promise<void>` - Initialize the database
- `get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined>` - Get a value
- `getAll<T>(storeName: string, options?: GetAllOptions): Promise<T[]>` - Get all values
- `put<T>(storeName: string, value: T, key?: IDBValidKey): Promise<IDBValidKey>` - Put a value
- `delete(storeName: string, key: IDBValidKey): Promise<void>` - Delete a value
- `clear(storeName: string): Promise<void>` - Clear all values
- `count(storeName: string, range?: IDBKeyRange): Promise<number>` - Count records

#### Signals

- `connectionState(): ConnectionState` - Current connection state ('connecting' | 'open' | 'closed' | 'error')
- `error(): Error | null` - Current error, if any
- `isConnected(): boolean` - Whether the database is connected
- `isConnecting(): boolean` - Whether the database is connecting

### IndexedDBSignalStore<T>

#### Methods

- `refresh(): Promise<void>` - Refresh data from IndexedDB
- `put(value: T): Promise<IDBValidKey>` - Add or update a value
- `delete(key: IDBValidKey): Promise<void>` - Delete a value
- `clear(): Promise<void>` - Clear all values
- `createFilteredSignal(filterFn: (item: T) => boolean): Signal<T[]>` - Create a filtered signal

#### Signals

- `data(): T[]` - All data in the store
- `count(): number` - Number of items
- `loading(): boolean` - Whether data is loading
- `isEmpty(): boolean` - Whether the store is empty

## SSR Support

For server-side rendering, you can serialize and restore IndexedDB state:

```typescript
// On server
const state = await indexedDBService.serializeState();
// Send to client

// On client (after hydration)
await indexedDBService.restoreState(state);
```

## Development

### Prerequisites

- Node.js 20.x
- pnpm 8+

### Setup

```bash
pnpm install
```

### Development Commands

```bash
# Run unit tests
pnpm test

# Run unit tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm e2e

# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Build library
pnpm build

# Clean generated files
pnpm clean
```

## Testing

This project uses:

- **Vitest** for unit testing
- **Playwright** for E2E testing

All tests must pass before pushing (enforced by Husky hooks).

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please ensure:

- All tests pass
- Code follows the linting rules
- Commits follow the conventional commit format
- Linear commit history is maintained
