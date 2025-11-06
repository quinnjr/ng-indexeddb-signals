import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideIndexedDB } from '../src/lib/indexeddb.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideIndexedDB({
      name: 'test-db',
      version: 1,
      stores: [
        {
          name: 'test-store',
          keyPath: 'id',
          autoIncrement: true,
        },
      ],
    }),
  ],
};
