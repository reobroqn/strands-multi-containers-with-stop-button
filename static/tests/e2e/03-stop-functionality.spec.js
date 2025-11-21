/**
 * Critical Test 3: Redis Stop Functionality
 * Tests immediate agent termination via Redis signals
 */

import { test, expect } from '@playwright/test';

test.describe('Redis Stop Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000/');
    await page.waitForLoadState('networkidle');
  });

  test('should stop agent immediately via Redis signal', async ({ page }) => {
    await page.fill('#chatId', 'test-stop-functionality');
    await page.fill('#message', 'Please count very slowly from 1 to 100 to test stop functionality.');

    // Send message to start agent
    await page.click('#sendBtn');

    // Verify agent starts responding
    await expect(page.locator('#sendBtn')).toBeDisabled();
    await expect(page.locator('#stopBtn')).toBeEnabled();
    await expect(page.locator('#status')).toContainText('Agent is typing');

    // Wait a moment for response to start
    await page.waitForTimeout(2000);

    // Click stop button
    const startTime = Date.now();
    await page.click('#stopBtn');
    const stopTime = Date.now();

    // Verify stop response
    await expect(page.locator('#status')).toContainText('Agent stopped successfully');
    await expect(page.locator('.enhanced-message-bot')).toContainText('[STOPPED]');

    // Verify button states reset
    await expect(page.locator('#sendBtn')).toBeEnabled();
    await expect(page.locator('#stopBtn')).toBeDisabled();
  });

  test('should handle Escape key shortcut for stopping agent', async ({ page }) => {
    await page.fill('#chatId', 'test-escape-stop');
    await page.fill('#message', 'Long task that will be stopped via Escape key.');

    // Send message
    await page.click('#sendBtn');

    // Wait for agent to start
    await expect(page.locator('#stopBtn')).toBeEnabled();

    // Use Escape key to stop
    await page.keyboard.press('Escape');

    // Should show stopped message
    await expect(page.locator('#status')).toContainText('Agent stopped successfully');
    await expect(page.locator('#stopBtn')).toBeDisabled();
  });

  test('should handle stop request without active agent gracefully', async ({ page }) => {
    await page.fill('#chatId', 'test-stop-no-agent');

    // Try to stop when no agent is active
    const initialStatus = await page.locator('#status').textContent();

    // The stop button should be disabled when no agent is active
    await expect(page.locator('#stopBtn')).toBeDisabled();

    // Status should remain unchanged
    await expect(page.locator('#status')).toHaveText(initialStatus);
  });
});
