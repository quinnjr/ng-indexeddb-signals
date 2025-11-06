import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IndexedDBService } from '../src/lib/indexeddb.service';
import { IndexedDBSignalStore } from '../src/lib/indexeddb-signal-store.service';

interface TestItem {
  id?: number;
  name: string;
  value: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: IndexedDBSignalStore,
      useFactory: () => new IndexedDBSignalStore<TestItem>('test-store'),
    },
  ],
  template: `
    <div class="container">
      <h1>IndexedDB Signals Demo</h1>

      <div class="status-section">
        <div data-testid="connection-status">Status: {{ connectionStatus() }}</div>
        <div data-testid="item-count">Items: {{ itemStore.count() }}</div>
        <div data-testid="loading" *ngIf="itemStore.loading()">Loading...</div>
      </div>

      <div class="form-section">
        <input
          type="text"
          placeholder="Item name"
          [(ngModel)]="itemName"
          data-testid="item-name"
          #nameInput="ngModel"
        />
        <input
          type="text"
          placeholder="Item value"
          [(ngModel)]="itemValue"
          data-testid="item-value"
          #valueInput="ngModel"
        />
        <button
          type="button"
          (click)="addItem()"
          [disabled]="!itemName || !itemValue"
          data-testid="add-button"
        >
          Add Item
        </button>
        <button type="button" (click)="clearAll()" [disabled]="itemStore.isEmpty()" data-testid="clear-button">
          Clear All
        </button>
      </div>

      <div class="list-section">
        <h2>Items</h2>
        <div data-testid="item-list">
          <div *ngIf="itemStore.isEmpty()" class="empty">No items</div>
          <div *ngFor="let item of itemStore.data(); let i = index" class="item">
            <span>{{ item.name }}: {{ item.value }}</span>
            <button type="button" (click)="deleteItem(item.id!)" data-testid="delete-button">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        font-family: Arial, sans-serif;
      }

      .status-section {
        margin-bottom: 20px;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 4px;
      }

      .form-section {
        margin-bottom: 20px;
        display: flex;
        gap: 10px;
      }

      .form-section input {
        flex: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .form-section button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        background: #007bff;
        color: white;
      }

      .form-section button:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .list-section {
        margin-top: 20px;
      }

      .item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        margin-bottom: 10px;
        background: #f9f9f9;
        border-radius: 4px;
      }

      .item button {
        padding: 6px 12px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      .empty {
        padding: 20px;
        text-align: center;
        color: #999;
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  private readonly indexedDB = inject(IndexedDBService);
  readonly itemStore = inject(IndexedDBSignalStore<TestItem>);

  itemName = '';
  itemValue = '';

  connectionStatus = computed(() => {
    if (this.indexedDB.isConnected()) {
      return 'Connected';
    } else if (this.indexedDB.isConnecting()) {
      return 'Connecting...';
    } else {
      return 'Disconnected';
    }
  });

  constructor() {
    // No need for effects - signals are used directly in template
    // This is the recommended approach for zoneless Angular
  }

  async ngOnInit() {
    try {
      // IndexedDB is now initialized via app.config.ts
      // Just refresh the store data
      await this.itemStore.refresh();
    } catch (error) {
      console.error('Failed to refresh IndexedDB store:', error);
    }
  }

  async addItem() {
    if (!this.itemName || !this.itemValue) {
      return;
    }

    try {
      await this.itemStore.put({
        name: this.itemName,
        value: this.itemValue,
      });

      this.itemName = '';
      this.itemValue = '';
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  }

  async deleteItem(id: number) {
    try {
      await this.itemStore.delete(id);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  }

  async clearAll() {
    try {
      await this.itemStore.clear();
    } catch (error) {
      console.error('Failed to clear items:', error);
    }
  }
}
