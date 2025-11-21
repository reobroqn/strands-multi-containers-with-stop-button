/**
 * Critical Test 4: UI Component Interactions and User Experience
 * Tests button states, form validation, animations, and user interactions
 */

import { test, expect } from '@playwright/test';

test.describe('UI Component Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000/');
    await page.waitForLoadState('networkidle');
  });

  test('should manage button states correctly during chat flow', async ({ page }) => {
    // Initial state
    await expect(page.locator('#sendBtn')).toBeEnabled(); // Chat ID auto-filled
    await expect(page.locator('#stopBtn')).toBeDisabled();
    await expect(page.locator('#clearBtn')).toBeEnabled();

    // During message sending
    await page.fill('#message', 'Test button states');
    await page.click('#sendBtn');

    await expect(page.locator('#sendBtn')).toBeDisabled();
    await expect(page.locator('#stopBtn')).toBeEnabled();
    await expect(page.locator('#clearBtn')).toBeEnabled();

    // After response completes or timeout
    await page.waitForTimeout(3000);
    await page.click('#stopBtn'); // Force stop for test reliability

    await expect(page.locator('#sendBtn')).toBeEnabled();
    await expect(page.locator('#stopBtn')).toBeDisabled();
  });

  test('should handle clear chat functionality properly', async ({ page }) => {
    // Add some messages first
    await page.fill('#message', 'Test message before clear');
    await page.click('#sendBtn');
    await page.waitForTimeout(2000);
    await page.click('#stopBtn');

    // Clear chat
    await page.click('#clearBtn');

    // Verify chat is cleared
    await expect(page.locator('.enhanced-message')).toContainText('Welcome!');
    await expect(page.locator('#message')).toHaveValue('');

    // Should generate new chat ID
    const chatIdValue = await page.locator('#chatId').inputValue();
    expect(chatIdValue).toMatch(/test-session-\d+/);
  });

  test('should display enhanced status messages correctly', async ({ page }) => {
    // Ready state
    await expect(page.locator('#status')).toContainText('Ready to chat');

    // Sending state
    await page.fill('#message', 'Test status changes');
    await page.click('#sendBtn');
    await expect(page.locator('#status')).toContainText('Agent is typing');

    // Error state
    await page.fill('#chatId', '');
    await page.fill('#message', '');
    await page.click('#sendBtn');
    await expect(page.locator('#status')).toContainText('Please enter both Chat ID and Message');
    await expect(page.locator('#status')).toHaveClass(/enhanced-status-error/);

    // Success state (after stop)
    await page.fill('#chatId', 'test-status');
    await page.fill('#message', 'Test success status');
    await page.click('#sendBtn');
    await page.waitForTimeout(1000);
    await page.click('#stopBtn');
    await expect(page.locator('#status')).toContainText('Agent stopped successfully');
  });

  test('should handle form input validation and auto-resize', async ({ page }) => {
    const messageInput = page.locator('#message');

    // Test auto-resize functionality
    const initialHeight = await messageInput.evaluate(el => el.style.height);

    // Add multiline content
    await messageInput.fill('This is a very long message\nthat spans multiple lines\nto test auto-resize functionality');

    // Height should increase
    const newHeight = await messageInput.evaluate(el => el.style.height);
    expect(parseInt(newHeight)).toBeGreaterThan(parseInt(initialHeight) || 40);

    // Test chat ID validation
    await page.fill('#chatId', '');
    await page.fill('#message', 'Test without chat ID');
    await page.click('#sendBtn');

    // Should show validation error
    await expect(page.locator('#status')).toContainText('Please enter both Chat ID and Message');
  });
});
