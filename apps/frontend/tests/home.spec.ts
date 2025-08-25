import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('Home Page', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Bridge Scoring/);
    await expect(page.locator('h1')).toContainText('Bridge Scoring');
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check skip link
    await page.keyboard.press('Tab');
    await expect(page.locator('a[href="#main"]')).toBeFocused();
    
    // Check main navigation links
    const newSessionLink = page.locator('a[href="/new"]');
    const eventsLink = page.locator('a[href="/events"]');
    const boardEntryLink = page.locator('a[href="/board-entry"]');
    
    await expect(newSessionLink).toBeVisible();
    await expect(eventsLink).toBeVisible();
    await expect(boardEntryLink).toBeVisible();
    
    // Test keyboard navigation
    await newSessionLink.focus();
    await expect(newSessionLink).toBeFocused();
  });

  test('should pass accessibility audit', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should navigate to new session', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/new"]');
    await expect(page).toHaveURL('/new');
    await expect(page.locator('h1')).toContainText('New Session');
  });

  test('should navigate to events', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/events"]');
    await expect(page).toHaveURL('/events');
    await expect(page.locator('h1')).toContainText('Events');
  });
}); 