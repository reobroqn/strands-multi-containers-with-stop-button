/**
 * Critical Test 1: Enhanced App Loading and Initialization
 * Verifies the modern UI loads correctly and all components are properly initialized
 */

import { test, expect } from '@playwright/test';

test.describe('Enhanced App Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000/');
    await page.waitForLoadState('networkidle');
  });

  test('should load enhanced UI and initialize application', async ({ page }) => {
    // Verify enhanced page title and modern styling
    await expect(page).toHaveTitle('FastAPI Agent Chat - Enhanced UI');
    await expect(page.locator('h1')).toContainText('🤖 FastAPI Agent Chat');

    // Check enhanced container and layout
    await expect(page.locator('.enhanced-container')).toBeVisible();
    await expect(page.locator('.enhanced-main')).toBeVisible();

    // Verify enhanced app is properly initialized
    await expect(page.waitForFunction(() => window.enhancedApp !== undefined)).toBeTruthy();

    // Check core UI components are present
    await expect(page.locator('#chatId')).toBeVisible();
    await expect(page.locator('#message')).toBeVisible();
    await expect(page.locator('#sendBtn')).toBeVisible();
    await expect(page.locator('#stopBtn')).toBeVisible();
    await expect(page.locator('#clearBtn')).toBeVisible();
    await expect(page.locator('#chatBox')).toBeVisible();

    // Verify enhanced styling classes
    await expect(page.locator('#chatId')).toHaveClass(/enhanced-input/);
    await expect(page.locator('#message')).toHaveClass(/enhanced-input/);
    await expect(page.locator('#sendBtn')).toHaveClass(/enhanced-button-primary/);
    await expect(page.locator('#stopBtn')).toHaveClass(/enhanced-button-danger/);
    await expect(page.locator('#chatBox')).toHaveClass(/enhanced-chat-box/);

    // Check initial application state
    const appState = await page.evaluate(() => window.enhancedApp.getAppState());
    expect(appState.sendDisabled).toBe(false); // Chat ID auto-filled
    expect(appState.stopDisabled).toBe(true);
    expect(appState.chatBox.isEmpty).toBe(true);
    expect(appState.status).toBe('Ready to chat');
  });

  test('should have responsive design for mobile and desktop', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    const desktopDisplay = await page.locator('.enhanced-main').evaluate(el =>
      window.getComputedStyle(el).display
    );
    expect(desktopDisplay).toBe('grid');

    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileDisplay = await page.locator('.enhanced-main').evaluate(el =>
      window.getComputedStyle(el).display
    );
    expect(mobileDisplay).toBe('grid');

    // Verify enhanced sidebar exists in desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('.enhanced-sidebar')).toBeVisible();
  });
});
