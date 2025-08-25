import { test, expect } from '@playwright/test';

test.describe('Board Entry', () => {
  test('should load board entry page', async ({ page }) => {
    await page.goto('/board-entry');
    await expect(page.locator('h1')).toContainText('Board 7');
  });

  test('should enter contract and calculate score', async ({ page }) => {
    await page.goto('/board-entry');
    
    // Enter level 3
    await page.click('button[aria-label="Number 3"]');
    
    // Select hearts suit
    await page.click('button[aria-label="H suit"]');
    
    // Select North as declarer
    await page.click('button:has-text("N")');
    
    // Enter 9 tricks
    await page.click('button[aria-label="Number 9"]');
    
    // Calculate score
    await page.click('button:has-text("Calculate Score")');
    
    // Should show score display
    await expect(page.locator('text=Contract:')).toBeVisible();
    await expect(page.locator('text=Result:')).toBeVisible();
  });

  test('should handle suit selection', async ({ page }) => {
    await page.goto('/board-entry');
    
    const suits = ['C', 'D', 'H', 'S', 'NT'];
    for (const suit of suits) {
      await page.click(`button[aria-label="${suit} suit"]`);
      await expect(page.locator(`button[aria-label="${suit} suit"]`)).toHaveClass(/ring-2/);
    }
  });

  test('should handle declarer selection', async ({ page }) => {
    await page.goto('/board-entry');
    
    const declarers = ['N', 'E', 'S', 'W'];
    for (const declarer of declarers) {
      await page.click(`button:has-text("${declarer}")`);
      await expect(page.locator(`button:has-text("${declarer}")`)).toHaveClass(/bg-\[hsl\(185_72%_35%\)\]/);
    }
  });

  test('should toggle doubled/redoubled', async ({ page }) => {
    await page.goto('/board-entry');
    
    const doubledButton = page.locator('button:has-text("Doubled")');
    const redoubledButton = page.locator('button:has-text("Redoubled")');
    
    await doubledButton.click();
    await expect(doubledButton).toHaveClass(/bg-\[hsl\(185_72%_35%\)\]/);
    
    await redoubledButton.click();
    await expect(redoubledButton).toHaveClass(/bg-\[hsl\(185_72%_35%\)\]/);
  });
}); 