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
        return () => indexedDB.initialize(config);
      },
      deps: [IndexedDBService],
      multi: true,
    },
  ]);
}
