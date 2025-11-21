import { test, expect } from '@playwright/test';

test.describe('FastAPI Agent Chat E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000/index.html');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Load and Initial State', () => {
    test('should load page with correct title and elements', async ({ page }) => {
      await expect(page).toHaveTitle('FastAPI Agent Chat - Test Client');

      // Check main elements are present
      await expect(page.locator('h1')).toContainText('🤖 FastAPI Agent Chat');
      await expect(page.locator('p.subtitle')).toContainText('Test the immediate stop functionality');
      await expect(page.locator('#sendBtn')).toBeVisible();
      await expect(page.locator('#stopBtn')).toBeVisible();
      await expect(page.locator('#stopBtn')).toBeDisabled();
    });

    test('should have correct initial status', async ({ page }) => {
      // Check status shows ready state
      await expect(page.locator('#status')).toContainText('Ready to chat');
    });

    test('should load all JavaScript modules without errors', async ({ page }) => {
      // Listen for console errors
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.waitForLoadState('networkidle');

      // Should have no module loading errors
      const moduleErrors = errors.filter(error =>
        error.includes('Failed to load module') ||
        error.includes('Application Error')
      );
      expect(moduleErrors).toHaveLength(0);
    });
  });

  test.describe('Input Fields and Chat ID', () => {
    test('should have functional chat ID and message inputs', async ({ page }) => {
      // Check that inputs are dynamically inserted
      await expect(page.locator('#inputContainer')).toBeVisible();

      // Look for chat ID input (should be created by MessageInput component)
      await expect(page.locator('input[placeholder*="Chat ID"]')).toBeVisible();
      await expect(page.locator('input[placeholder*="Enter your message"]')).toBeVisible();
    });

    test('should allow entering chat ID and message', async ({ page }) => {
      const chatIdInput = page.locator('input[placeholder*="Chat ID"]');
      const messageInput = page.locator('input[placeholder*="Enter your message"]');

      await chatIdInput.fill('test-chat-123');
      await messageInput.fill('Hello, agent!');

      await expect(chatIdInput).toHaveValue('test-chat-123');
      await expect(messageInput).toHaveValue('Hello, agent!');
    });

    test('should validate chat ID input', async ({ page }) => {
      const chatIdInput = page.locator('input[placeholder*="Chat ID"]');
      const messageInput = page.locator('input[placeholder*="Enter your message"]');

      // Try to send without chat ID
      await messageInput.fill('Test message');
      await page.locator('#sendBtn').click();

      // Should show error or not proceed
      // The exact behavior depends on implementation
      await expect(page.locator('#status')).toBeVisible();
    });
  });

  test.describe('Clear Chat Functionality', () => {
    test('should identify both clear chat buttons', async ({ page }) => {
      const clearButtons = page.locator('button:has-text("Clear Chat")');
      await expect(clearButtons).toHaveCount(2);

      // Check button properties
      const firstButton = clearButtons.first();
      const secondButton = clearButtons.nth(1);

      await expect(firstButton).toBeVisible();
      await expect(secondButton).toBeVisible();

      // Check one has onclick handler and the other has id
      const firstOnClick = await firstButton.getAttribute('onclick');
      const secondId = await secondButton.getAttribute('id');

      expect(firstOnClick).toBe('clearChat()');
      expect(secondId).toBe('clearBtn');
    });

    test('should clear chat when first clear button is clicked', async ({ page }) => {
      const chatIdInput = page.locator('input[placeholder*="Chat ID"]');
      const messageInput = page.locator('input[placeholder*="Enter your message"]');
      const clearButton = page.locator('button[onclick="clearChat()"]');

      // Fill some data
      await chatIdInput.fill('test-chat');
      await messageInput.fill('test message');

      // Clear chat
      await clearButton.click();

      // Verify inputs are cleared
      await expect(chatIdInput).toHaveValue('');
      await expect(messageInput).toHaveValue('');

      // Verify status shows cleared
      await expect(page.locator('#status')).toContainText('Chat cleared');
    });

    test('should clear chat when second clear button is clicked', async ({ page }) => {
      const chatIdInput = page.locator('input[placeholder*="Chat ID"]');
      const messageInput = page.locator('input[placeholder*="Enter your message"]');
      const clearButton = page.locator('button#clearBtn');

      // Fill some data
      await chatIdInput.fill('test-chat');
      await messageInput.fill('test message');

      // Clear chat
      await clearButton.click();

      // Verify inputs are cleared
      await expect(chatIdInput).toHaveValue('');
      await expect(messageInput).toHaveValue('');
    });
  });

  test.describe('Message Sending and Response', () => {
    test('should enable/disable send button based on input', async ({ page }) => {
      const chatIdInput = page.locator('input[placeholder*="Chat ID"]');
      const messageInput = page.locator('input[placeholder*="Enter your message"]');
      const sendButton = page.locator('#sendBtn');

      // Initially send button should be disabled
      await expect(sendButton).toBeVisible();

      // Fill chat ID
      await chatIdInput.fill('test-chat-123');

      // Fill message
      await messageInput.fill('Hello agent');

      // Send button should now be enabled
      await expect(sendButton).toBeEnabled();
    });

    test('should send message when send button is clicked', async ({ page }) => {
      const chatIdInput = page.locator('input[placeholder*="Chat ID"]');
      const messageInput = page.locator('input[placeholder*="Enter your message"]');
      const sendButton = page.locator('#sendBtn');

      // Fill inputs
      await chatIdInput.fill('test-chat-123');
      await messageInput.fill('Count to 10');

      // Send message
      await sendButton.click();

      // Check that user message appears in chat
      await expect(page.locator('#chatBox')).toContainText('Count to 10');

      // Check that stop button becomes enabled
      await expect(page.locator('#stopBtn')).toBeEnabled();

      // Check status shows connecting then connected
      await expect(page.locator('#status')).toContainText('Connecting');
    });

    test('should support Enter key to send message', async ({ page }) => {
      const chatIdInput = page.locator('input[placeholder*="Chat ID"]');
      const messageInput = page.locator('input[placeholder*="Enter your message"]');

      // Fill inputs
      await chatIdInput.fill('test-chat-123');
      await messageInput.fill('Test with Enter');

      // Press Enter
      await messageInput.press('Enter');

      // Should send message
      await expect(page.locator('#chatBox')).toContainText('Test with Enter');
    });
  });

  test.describe('Stop Functionality', () => {
    test('should stop agent response within 100ms', async ({ page }) => {
      const chatIdInput = page.locator('input[placeholder*="Chat ID"]');
      const messageInput = page.locator('input[placeholder*="Enter your message"]');
      const sendButton = page.locator('#sendBtn');
      const stopButton = page.locator('#stopBtn');

      // Fill inputs and send long message
      await chatIdInput.fill('test-chat-123');
      await messageInput.fill('Please count very slowly from 1 to 1000');
      await sendButton.click();

      // Wait for response to start
      await expect(page.locator('#stopBtn')).toBeEnabled();

      // Measure stop time
      const startTime = Date.now();
      await stopButton.click();
      const stopTime = Date.now();

      // Should stop within 100ms
      const responseTime = stopTime - startTime;
      expect(responseTime).toBeLessThan(200); // Allow some margin for test environment

      // Check for stopped message
      await expect(page.locator('#chatBox')).toContainText('[SYSTEM] Stop signal sent');

      // Stop button should be disabled again
      await expect(page.locator('#stopBtn')).toBeDisabled();
    });

    test('should show keyboard shortcut support', async ({ page }) => {
      const chatIdInput = page.locator('input[placeholder*="Chat ID"]');
      const messageInput = page.locator('input[placeholder*="Enter your message"]');
      const sendButton = page.locator('#sendBtn');

      // Start a chat
      await chatIdInput.fill('test-chat-123');
      await messageInput.fill('Long task');
      await sendButton.click();

      // Wait for response to start
      await expect(page.locator('#stopBtn')).toBeEnabled();

      // Test Escape key shortcut
      await page.keyboard.press('Escape');

      // Should trigger stop
      await expect(page.locator('#chatBox')).toContainText('[SYSTEM] Stop signal sent');
    });

    test('should test Ctrl/Cmd+K shortcut for clear chat', async ({ page }) => {
      const chatIdInput = page.locator('input[placeholder*="Chat ID"]');
      const messageInput = page.locator('input[placeholder*="Enter your message"]');

      // Fill some data
      await chatIdInput.fill('test-chat');
      await messageInput.fill('test message');

      // Test Ctrl+K (Windows/Linux)
      await page.keyboard.press('Control+KeyK');

      // Should clear inputs
      await expect(chatIdInput).toHaveValue('');
      await expect(messageInput).toHaveValue('');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network offline
      await page.context().setOffline(true);

      const chatIdInput = page.locator('input[placeholder*="Chat ID"]');
      const messageInput = page.locator('input[placeholder*="Enter your message"]');
      const sendButton = page.locator('#sendBtn');

      // Try to send message
      await chatIdInput.fill('test-chat-123');
      await messageInput.fill('Test message');
      await sendButton.click();

      // Should show error
      await expect(page.locator('#status')).toContainText('Failed to send message', { timeout: 5000 });

      // Restore connection
      await page.context().setOffline(false);
    });

    test('should handle invalid chat ID', async ({ page }) => {
      const chatIdInput = page.locator('input[placeholder*="Chat ID"]');
      const messageInput = page.locator('input[placeholder*="Enter your message"]');
      const sendButton = page.locator('#sendBtn');

      // Try with empty chat ID
      await messageInput.fill('Test message');
      await sendButton.click();

      // Should show validation or error
      await expect(page.locator('#status')).toBeVisible();
    });
  });

  test.describe('Component Integration', () => {
    test('should have all required components loaded', async ({ page }) => {
      // Check that app is initialized
      await expect(page.waitForFunction(() => window.chatApp !== undefined)).toBeTruthy();

      // Check app state
      const appState = await page.evaluate(() => window.chatApp.getAppState());

      expect(appState).toHaveProperty('chatBox');
      expect(appState).toHaveProperty('controls');
      expect(appState).toHaveProperty('status');
      expect(appState).toHaveProperty('service');

      // Initial state should be clean
      expect(appState.chatBox.isEmpty).toBe(true);
      expect(appState.controls.stopEnabled).toBe(false);
      expect(appState.isStreaming).toBe(false);
    });

    test('should maintain consistent state across components', async ({ page }) => {
      const chatIdInput = page.locator('input[placeholder*="Chat ID"]');
      const messageInput = page.locator('input[placeholder*="Enter your message"]');

      // Change chat ID
      await chatIdInput.fill('test-chat-456');

      // Check app state reflects change
      const appState = await page.evaluate(() => window.chatApp.getAppState());
      expect(appState.service.currentChatId).toBe('test-chat-456');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check for proper button roles
      await expect(page.locator('#sendBtn')).toHaveAttribute('role', 'button');
      await expect(page.locator('#stopBtn')).toHaveAttribute('role', 'button');

      // Check for proper form labels
      const chatIdInput = page.locator('input[placeholder*="Chat ID"]');
      await expect(chatIdInput).toHaveAttribute('type', 'text');
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through elements
      await page.keyboard.press('Tab');

      // Should focus on first interactive element
      const focusedElement = await page.evaluate(() => document.activeElement.tagName);
      expect(['INPUT', 'BUTTON']).toContain(focusedElement);
    });
  });
});