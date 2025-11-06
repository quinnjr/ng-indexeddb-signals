import { NgModule } from '@angular/core';
import { IndexedDBService } from './indexeddb.service';
import { IndexedDBSignalStore } from './indexeddb-signal-store.service';

@NgModule({
  providers: [IndexedDBService, IndexedDBSignalStore],
})
export class IndexedDBModule {
  /**
   * Configure IndexedDB module
   */
  static forRoot(config: {
    name: string;
    version: number;
    stores: Array<{
      name: string;
      keyPath?: string | string[];
      autoIncrement?: boolean;
      indexes?: Array<{
        name: string;
        keyPath: string | string[];
        unique?: boolean;
      }>;
    }>;
  }): { ngModule: typeof IndexedDBModule; providers: Array<{ provide: string; useValue: typeof config }> } {
    return {
      ngModule: IndexedDBModule,
      providers: [
        {
          provide: 'INDEXED_DB_CONFIG',
          useValue: config,
        },
      ],
    };
  }
}
