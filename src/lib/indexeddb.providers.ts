import { APP_INITIALIZER, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { IndexedDBService, IndexedDBConfig } from './indexeddb.service';

/**
 * Provider function to configure IndexedDB in app.config.ts
 *
 * @example
 * ```typescript
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideIndexedDB({
 *       name: 'my-database',
 *       version: 1,
 *       stores: [
 *         {
 *           name: 'users',
 *           keyPath: 'id',
 *           autoIncrement: true,
 *         },
 *       ],
 *     }),
 *   ],
 * };
 * ```
 */
export function provideIndexedDB(config: IndexedDBConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      useFactory: (indexedDB: IndexedDBService) => {
        return () => {
          // Initialize IndexedDB, but don't block app startup if it fails
          return indexedDB.initialize(config).catch(error => {
            console.error('Failed to initialize IndexedDB:', error);
            // Don't throw - allow app to continue even if IndexedDB fails
            // The service will handle the error state via signals
            return Promise.resolve();
          });
        };
      },
      deps: [IndexedDBService],
      multi: true,
    },
  ]);
}
