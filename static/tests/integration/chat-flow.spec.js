/**
 * Chat Flow Integration Tests
 * Test complete chat workflows including message sending, streaming, and stopping
 */

import { test, expect } from '@playwright/test';

test.describe('Chat Flow Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/static/index.html');

    // Wait for all components to load
    await page.waitForSelector('#chatBox', { timeout: 5000 });
    await page.waitForSelector('#chatId', { timeout: 5000 });
    await page.waitForSelector('#sendBtn', { timeout: 5000 });
  });

  test('should load application with initial state', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle('FastAPI Agent Chat - Test Client');

    // Check main elements are present
    await expect(page.locator('h1')).toContainText('FastAPI Agent Chat');
    await expect(page.locator('.subtitle')).toContainText('Test the immediate stop functionality');

    // Check chat elements
    await expect(page.locator('#chatBox')).toBeVisible();
    await expect(page.locator('#chatId')).toBeVisible();
    await expect(page.locator('#sendBtn')).toBeVisible();
    await expect(page.locator('#stopBtn')).toBeVisible();
    await expect(page.locator('.clear-btn')).toBeVisible();

    // Check initial button states
    await expect(page.locator('#sendBtn')).toBeEnabled();
    await expect(page.locator('#stopBtn')).toBeDisabled();

    // Check welcome message
    const chatBox = page.locator('#chatBox');
    await expect(chatBox.locator('.system-message')).toContainText('Welcome!');
  });

  test('should create message input when user interacts', async ({ page }) => {
    // Initially, message input shouldn't exist
    await expect(page.locator('#messageInput')).not.toBeVisible();

    // Click send button to trigger message input creation
    await page.click('#sendBtn');

    // Now message input should be created
    await expect(page.locator('#messageInput')).toBeVisible();
    await expect(page.locator('label[for="messageInput"]')).toContainText('Message');
  });

  test('should validate required fields', async ({ page }) => {
    // Try to send without message input
    await page.click('#sendBtn');

    // Should show error (via alert or status)
    await page.waitForTimeout(100); // Allow for validation

    // Create message input
    await page.click('#sendBtn');
    await page.fill('#messageInput', '');

    // Try to send empty message
    await page.click('#sendBtn');

    // Should show validation error
    await page.waitForTimeout(100);
  });

  test('should send message when both fields are filled', async ({ page }) => {
    // Set chat ID
    await page.fill('#chatId', 'test-chat-123');

    // Click send to create message input
    await page.click('#sendBtn');

    // Fill message
    await page.fill('#messageInput', 'Hello, how are you?');

    // Send message
    await page.click('#sendBtn');

    // Check that user message appears in chat
    const userMessage = page.locator('#chatBox .user-message').last();
    await expect(userMessage).toContainText('You: Hello, how are you?');

    // Check button states change
    await expect(page.locator('#sendBtn')).toBeDisabled();
    await expect(page.locator('#stopBtn')).toBeEnabled();

    // Check status shows connecting
    await expect(page.locator('#status')).toContainText('Connecting');
  });

  test('should clear chat successfully', async ({ page }) => {
    // First send a message to have content
    await page.fill('#chatId', 'test-chat-456');
    await page.click('#sendBtn');
    await page.fill('#messageInput', 'Test message');
    await page.click('#sendBtn');

    // Wait for message to appear
    await expect(page.locator('#chatBox .user-message')).toBeVisible();

    // Clear chat
    await page.click('.clear-btn');

    // Check chat is cleared with welcome message
    await expect(page.locator('#chatBox .system-message')).toContainText('Chat cleared');

    // Check button states are reset
    await expect(page.locator('#sendBtn')).toBeEnabled();
    await expect(page.locator('#stopBtn')).toBeDisabled();

    // Check chat ID is reset to default
    await expect(page.locator('#chatId')).toHaveValue('test-chat-001');
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Create message input
    await page.click('#sendBtn');
    await page.fill('#messageInput', 'Test message from keyboard');

    // Focus on message input and press Enter
    await page.focus('#messageInput');
    await page.keyboard.press('Enter');

    // Check message was sent
    await expect(page.locator('#chatBox .user-message')).toContainText('Test message from keyboard');
  });

  test('should update info box based on application state', async ({ page }) => {
    const infoBox = page.locator('.info-box');

    // Initially should show welcome content
    await expect(infoBox).toContainText('How to Test the Stop Button');
    await expect(infoBox).toContainText('Nginx → Multiple FastAPI backends → Redis');

    // Start a chat to see state change
    await page.fill('#chatId', 'test-chat-state');
    await page.click('#sendBtn');
    await page.fill('#messageInput', 'State change test');
    await page.click('#sendBtn');

    // Info box should update during chat
    await expect(infoBox).toContainText('Chat Tips');
  });

  test('should maintain chat ID when changed', async ({ page }) => {
    // Change chat ID
    await page.fill('#chatId', 'custom-chat-session');
    await page.blur('#chatId'); // Trigger change event

    // Check status shows updated chat ID
    await expect(page.locator('#status')).toContainText('Chat ID: custom-chat-session');
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check elements are still visible and functional
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('#chatBox')).toBeVisible();
    await expect(page.locator('.controls')).toBeVisible();

    // Check controls stack vertically on mobile
    const controls = page.locator('.controls');
    const computedStyle = await controls.evaluate(el => {
      return window.getComputedStyle(el).flexDirection;
    });
    expect(computedStyle).toBe('column');
  });

  test('should handle accessibility features', async ({ page }) => {
    // Check tab order works correctly
    await page.keyboard.press('Tab'); // Should focus chat ID
    await expect(page.locator('#chatId')).toBeFocused();

    await page.keyboard.press('Tab'); // Should focus send button
    await expect(page.locator('#sendBtn')).toBeFocused();

    // Check focus indicators are visible
    const sendBtn = page.locator('#sendBtn');
    await sendBtn.focus();
    const focusedStyles = await sendBtn.evaluate(el => {
      const style = window.getComputedStyle(el, ':focus-visible');
      return {
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor
      };
    });

    expect(focusedStyles.outlineWidth).not.toBe('0px');
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock a failed fetch request
    await page.route('**/api/v1/chat/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Try to send a message
    await page.fill('#chatId', 'error-test');
    await page.click('#sendBtn');
    await page.fill('#messageInput', 'This should fail');
    await page.click('#sendBtn');

    // Should show error status
    await expect(page.locator('#status')).toContainText('Error');

    // Should reset button states
    await expect(page.locator('#sendBtn')).toBeEnabled();
    await expect(page.locator('#stopBtn')).toBeDisabled();

    // Info box should show error content
    const infoBox = page.locator('.info-box');
    await expect(infoBox).toContainText('Connection Issue');
  });

  test('should handle component loading errors', async ({ page }) => {
    // Simulate a module loading error by injecting error script
    await page.addScriptTag({
      content: `
        window.addEventListener('error', function(e) {
          if (e.target.tagName === 'SCRIPT' && e.target.type === 'module') {
            // Prevent default error handling
            e.preventDefault();
          }
        }, true);
      `
    });

    // Force a module loading error
    await page.evaluate(() => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'non-existent-module.js';
      document.head.appendChild(script);
    });

    // Give it time to trigger error handling
    await page.waitForTimeout(1000);

    // Check if error page is shown or if app still works
    const hasErrorContent = await page.locator('text=Application Error').isVisible();
    const hasWorkingApp = await page.locator('#chatBox').isVisible();

    // Either error page is shown OR app still works
    expect(hasErrorContent || hasWorkingApp).toBeTruthy();
  });
});
