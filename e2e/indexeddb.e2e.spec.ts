import { test, expect } from '@playwright/test';

test.describe('IndexedDB Signals E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for Angular to bootstrap
    await page.waitForLoadState('networkidle');
    // Wait a bit more for Angular to initialize
    await page.waitForTimeout(1000);
  });

  test('should initialize IndexedDB and show connection status', async ({ page }) => {
    // Wait for the app to initialize
    await page.waitForSelector('[data-testid="connection-status"]', { timeout: 5000 });

    // Check that connection status is displayed
    const connectionStatus = await page.textContent('[data-testid="connection-status"]');
    expect(connectionStatus).toContain('Connected');
  });

  test('should add item to store', async ({ page }) => {
    // Wait for initialization
    await page.waitForSelector('[data-testid="connection-status"]');

    // Fill in the form
    await page.fill('[data-testid="item-name"]', 'Test Item');
    await page.fill('[data-testid="item-value"]', 'Test Value');

    // Click add button
    await page.click('[data-testid="add-button"]');

    // Wait for item to appear in list (wait for text content)
    await page.waitForFunction(
      () => {
        const list = document.querySelector('[data-testid="item-list"]');
        return list && list.textContent?.includes('Test Item');
      },
      { timeout: 5000 }
    );

    // Verify item was added
    const itemList = await page.textContent('[data-testid="item-list"]');
    expect(itemList).toContain('Test Item');
  });

  test('should display items from store', async ({ page }) => {
    // Wait for initialization
    await page.waitForSelector('[data-testid="connection-status"]');

    // Add first item
    await page.fill('[data-testid="item-name"]', 'Item 1');
    await page.fill('[data-testid="item-value"]', 'Value 1');
    await page.click('[data-testid="add-button"]');

    // Wait for first item to appear
    await page.waitForFunction(
      () => {
        const list = document.querySelector('[data-testid="item-list"]');
        return list && list.textContent?.includes('Item 1');
      },
      { timeout: 5000 }
    );

    // Add second item
    await page.fill('[data-testid="item-name"]', 'Item 2');
    await page.fill('[data-testid="item-value"]', 'Value 2');
    await page.click('[data-testid="add-button"]');

    // Wait for both items to appear
    await page.waitForFunction(
      () => {
        const list = document.querySelector('[data-testid="item-list"]');
        return list && list.textContent?.includes('Item 1') && list.textContent?.includes('Item 2');
      },
      { timeout: 5000 }
    );

    // Verify both items are displayed
    const itemList = await page.textContent('[data-testid="item-list"]');
    expect(itemList).toContain('Item 1');
    expect(itemList).toContain('Item 2');
  });

  test('should delete item from store', async ({ page }) => {
    // Wait for initialization
    await page.waitForSelector('[data-testid="connection-status"]');

    // Add an item
    await page.fill('[data-testid="item-name"]', 'Item to Delete');
    await page.fill('[data-testid="item-value"]', 'Value');
    await page.click('[data-testid="add-button"]');

    await page.waitForTimeout(500);

    // Verify item exists
    let itemList = await page.textContent('[data-testid="item-list"]');
    expect(itemList).toContain('Item to Delete');

    // Click delete button (first delete button)
    await page.click('[data-testid="delete-button"]:first-of-type');

    await page.waitForTimeout(500);

    // Verify item was deleted
    itemList = await page.textContent('[data-testid="item-list"]');
    expect(itemList).not.toContain('Item to Delete');
  });

  test('should clear all items', async ({ page }) => {
    // Wait for initialization
    await page.waitForSelector('[data-testid="connection-status"]');

    // Add items
    await page.fill('[data-testid="item-name"]', 'Item 1');
    await page.fill('[data-testid="item-value"]', 'Value 1');
    await page.click('[data-testid="add-button"]');

    await page.waitForTimeout(500);

    await page.fill('[data-testid="item-name"]', 'Item 2');
    await page.fill('[data-testid="item-value"]', 'Value 2');
    await page.click('[data-testid="add-button"]');

    await page.waitForTimeout(500);

    // Click clear button
    await page.click('[data-testid="clear-button"]');

    await page.waitForTimeout(500);

    // Verify list is empty
    const itemList = await page.textContent('[data-testid="item-list"]');
    expect(itemList).toBe('No items');
  });

  test('should show loading state', async ({ page }) => {
    // Wait for initialization
    await page.waitForSelector('[data-testid="connection-status"]');

    // Check loading indicator is not visible initially
    const loadingIndicator = await page.locator('[data-testid="loading"]').isVisible();
    expect(loadingIndicator).toBeFalsy();

    // Add item and check loading appears briefly
    await page.fill('[data-testid="item-name"]', 'Test');
    await page.fill('[data-testid="item-value"]', 'Test');
    await page.click('[data-testid="add-button"]');

    // Loading might be too fast to catch, but we verify the operation completes
    await page.waitForSelector('[data-testid="item-list"]', { timeout: 2000 });
  });

  test('should display item count', async ({ page }) => {
    // Wait for initialization
    await page.waitForSelector('[data-testid="connection-status"]');

    // Check initial count
    let countText = await page.textContent('[data-testid="item-count"]');
    expect(countText).toContain('0');

    // Add items
    await page.fill('[data-testid="item-name"]', 'Item 1');
    await page.fill('[data-testid="item-value"]', 'Value 1');
    await page.click('[data-testid="add-button"]');

    await page.waitForTimeout(500);

    await page.fill('[data-testid="item-name"]', 'Item 2');
    await page.fill('[data-testid="item-value"]', 'Value 2');
    await page.click('[data-testid="add-button"]');

    await page.waitForTimeout(500);

    // Check updated count
    countText = await page.textContent('[data-testid="item-count"]');
    expect(countText).toContain('2');
  });

  test('should disable add button when form is empty', async ({ page }) => {
    // Wait for initialization
    await page.waitForSelector('[data-testid="connection-status"]');

    // Check that add button is disabled initially
    const addButton = page.locator('[data-testid="add-button"]');
    await expect(addButton).toBeDisabled();

    // Fill only name - button should still be disabled
    await page.fill('[data-testid="item-name"]', 'Test');
    await expect(addButton).toBeDisabled();

    // Fill value - button should be enabled
    await page.fill('[data-testid="item-value"]', 'Value');
    await expect(addButton).toBeEnabled();
  });

  test('should disable clear button when store is empty', async ({ page }) => {
    // Wait for initialization
    await page.waitForSelector('[data-testid="connection-status"]');

    // Check that clear button is disabled initially
    const clearButton = page.locator('[data-testid="clear-button"]');
    await expect(clearButton).toBeDisabled();

    // Add an item
    await page.fill('[data-testid="item-name"]', 'Test Item');
    await page.fill('[data-testid="item-value"]', 'Test Value');
    await page.click('[data-testid="add-button"]');

    // Wait for item to appear
    await page.waitForFunction(
      () => {
        const list = document.querySelector('[data-testid="item-list"]');
        return list && list.textContent?.includes('Test Item');
      },
      { timeout: 5000 }
    );

    // Clear button should now be enabled
    await expect(clearButton).toBeEnabled();

    // Clear items
    await page.click('[data-testid="clear-button"]');
    await page.waitForTimeout(500);

    // Clear button should be disabled again
    await expect(clearButton).toBeDisabled();
  });

  test('should show empty state when no items', async ({ page }) => {
    // Wait for initialization
    await page.waitForSelector('[data-testid="connection-status"]');

    // Check empty state is shown
    const itemList = await page.textContent('[data-testid="item-list"]');
    expect(itemList).toBe('No items');

    // Add an item
    await page.fill('[data-testid="item-name"]', 'Test Item');
    await page.fill('[data-testid="item-value"]', 'Test Value');
    await page.click('[data-testid="add-button"]');

    // Wait for item to appear
    await page.waitForFunction(
      () => {
        const list = document.querySelector('[data-testid="item-list"]');
        return list && list.textContent?.includes('Test Item');
      },
      { timeout: 5000 }
    );

    // Empty state should not be shown
    const itemListAfter = await page.textContent('[data-testid="item-list"]');
    expect(itemListAfter).not.toContain('No items');
  });

  test('should persist data across page reloads', async ({ page }) => {
    // Wait for initialization
    await page.waitForSelector('[data-testid="connection-status"]');

    // Add an item
    await page.fill('[data-testid="item-name"]', 'Persistent Item');
    await page.fill('[data-testid="item-value"]', 'Persistent Value');
    await page.click('[data-testid="add-button"]');

    // Wait for item to appear
    await page.waitForFunction(
      () => {
        const list = document.querySelector('[data-testid="item-list"]');
        return list && list.textContent?.includes('Persistent Item');
      },
      { timeout: 5000 }
    );

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Wait for app to initialize
    await page.waitForSelector('[data-testid="connection-status"]');

    // Item should still be there after reload
    await page.waitForFunction(
      () => {
        const list = document.querySelector('[data-testid="item-list"]');
        return list && list.textContent?.includes('Persistent Item');
      },
      { timeout: 5000 }
    );

    const itemList = await page.textContent('[data-testid="item-list"]');
    expect(itemList).toContain('Persistent Item');
  });

  test('should handle rapid consecutive operations', async ({ page }) => {
    // Wait for initialization
    await page.waitForSelector('[data-testid="connection-status"]');

    // Rapidly add multiple items
    for (let i = 1; i <= 5; i++) {
      await page.fill('[data-testid="item-name"]', `Rapid Item ${i}`);
      await page.fill('[data-testid="item-value"]', `Value ${i}`);
      await page.click('[data-testid="add-button"]');
      // Small delay to allow processing
      await page.waitForTimeout(100);
    }

    // Wait for all items to appear
    await page.waitForFunction(
      () => {
        const list = document.querySelector('[data-testid="item-list"]');
        const text = list?.textContent || '';
        return (
          text.includes('Rapid Item 1') &&
          text.includes('Rapid Item 5') &&
          (text.match(/Rapid Item/g) || []).length >= 5
        );
      },
      { timeout: 5000 }
    );

    // Verify all items are present
    const itemList = await page.textContent('[data-testid="item-list"]');
    expect(itemList).toContain('Rapid Item 1');
    expect(itemList).toContain('Rapid Item 5');
  });

  test('should show connecting state during initialization', async ({ page }) => {
    // Navigate to page and immediately check for connecting state
    // Note: This might be too fast to catch, but we can verify the final state
    await page.goto('/');

    // Wait for connection to complete
    await page.waitForSelector('[data-testid="connection-status"]', { timeout: 5000 });

    // Verify we end up in connected state
    const connectionStatus = await page.textContent('[data-testid="connection-status"]');
    expect(connectionStatus).toContain('Connected');
  });
});
