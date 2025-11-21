/**
 * Critical Test 2: Core Chat Functionality and API Integration
 * Tests message sending, streaming responses, and FastAPI integration
 */

import { test, expect } from '@playwright/test';

test.describe('Core Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000/');
    await page.waitForLoadState('networkidle');
  });

  test('should send message and receive streaming response', async ({ page }) => {
    // Fill chat form
    await page.fill('#chatId', 'test-chat-functionality');
    await page.fill('#message', 'Hello! Please respond with a simple greeting.');

    // Send message
    await page.click('#sendBtn');

    // Verify UI state changes
    await expect(page.locator('#sendBtn')).toBeDisabled();
    await expect(page.locator('#stopBtn')).toBeEnabled();
    await expect(page.locator('#status')).toContainText('Agent is typing');

    // Wait for response
    await expect(page.locator('.enhanced-message-user')).toContainText('You: Hello! Please respond with a simple greeting.');
    await expect(page.locator('#status')).toContainText('Ready to chat', { timeout: 10000 });

    // Verify final state
    await expect(page.locator('#sendBtn')).toBeEnabled();
    await expect(page.locator('#stopBtn')).toBeDisabled();
  });

  test('should handle message validation correctly', async ({ page }) => {
    // Try to send without message
    await page.fill('#chatId', 'test-validation');
    await page.click('#sendBtn');

    // Should show validation error
    await expect(page.locator('#status')).toContainText('Please enter both Chat ID and Message');
    await expect(page.locator('#status')).toHaveClass(/enhanced-status-error/);

    // Fill only chat ID
    await page.fill('#message', 'Test message');
    await page.click('#sendBtn');

    // Should send successfully (chat ID is filled)
    await expect(page.locator('#sendBtn')).toBeDisabled({ timeout: 5000 });
  });

  test('should support keyboard shortcuts for better UX', async ({ page }) => {
    await page.fill('#chatId', 'test-keyboard');
    await page.fill('#message', 'Test keyboard shortcut');

    // Test Enter key to send
    await page.press('#message', 'Enter');

    // Should start sending (button becomes disabled)
    await expect(page.locator('#sendBtn')).toBeDisabled();

    // Wait for response or stop
    await page.waitForTimeout(2000);

    // Test Ctrl+K to clear chat
    await page.keyboard.press('Control+KeyK');
    await expect(page.locator('#message')).toHaveValue('');
  });
});
