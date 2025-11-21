/**
 * ChatBox Component Tests
 * Unit tests for the ChatBox component functionality
 */

import { test, expect } from '@playwright/test';

test.describe('ChatBox Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/static/index.html');
    await page.waitForSelector('#chatBox');
  });

  test('should initialize with welcome message', async ({ page }) => {
    const chatBox = page.locator('#chatBox');

    await expect(chatBox).toBeVisible();
    await expect(chatBox.locator('.system-message')).toContainText('Welcome!');
    await expect(chatBox.locator('.message')).toHaveCount(1); // Only welcome message
  });

  test('should add user messages correctly', async ({ page }) => {
    // Use the chatApp API to add a user message
    await page.evaluate(() => {
      window.chatApp.chatBox.addUserMessage('Hello world');
    });

    const chatBox = page.locator('#chatBox');
    const messages = chatBox.locator('.message');

    await expect(messages).toHaveCount(2);
    await expect(messages.last()).toHaveClass(/user-message/);
    await expect(messages.last()).toContainText('You: Hello world');
  });

  test('should add bot messages correctly', async ({ page }) => {
    await page.evaluate(() => {
      window.chatApp.chatBox.addMessage('Hello! How can I help you?', 'bot-message');
    });

    const chatBox = page.locator('#chatBox');
    const botMessages = chatBox.locator('.bot-message');

    await expect(botMessages).toHaveCount(1);
    await expect(botMessages).toContainText('Agent: Hello! How can I help you?');
  });

  test('should add system messages correctly', async ({ page }) => {
    await page.evaluate(() => {
      window.chatApp.chatBox.addMessage('System notification', 'system-message');
    });

    const chatBox = page.locator('#chatBox');
    const systemMessages = chatBox.locator('.system-message');

    await expect(systemMessages).toHaveCount(2); // Welcome + new system message
    await expect(systemMessages.last()).toContainText('System notification');
  });

  test('should handle streaming messages correctly', async ({ page }) => {
    // Start a streaming bot message
    await page.evaluate(() => {
      window.chatApp.chatBox.addUserMessage('Tell me a story');
      window.chatApp.chatBox.addMessage('Once upon a time', 'bot-message', true);
    });

    const chatBox = page.locator('#chatBox');
    const botMessages = chatBox.locator('.bot-message');

    await expect(botMessages).toHaveCount(1);
    await expect(botMessages.last()).toContainText('Once upon a time');

    // Add more streaming content
    await page.evaluate(() => {
      const lastMessage = document.querySelector('#chatBox .message:last-child');
      if (lastMessage && lastMessage.classList.contains('bot-message')) {
        lastMessage.textContent += ', there lived a brave knight';
      }
    });

    await expect(botMessages.last()).toContainText('Once upon a time, there lived a brave knight');
  });

  test('should clear chat correctly', async ({ page }) => {
    // Add some messages
    await page.evaluate(() => {
      window.chatApp.chatBox.addUserMessage('First message');
      window.chatApp.chatBox.addMessage('First response', 'bot-message');
      window.chatApp.chatBox.addSystem('System message');
    });

    // Verify messages were added
    const chatBox = page.locator('#chatBox');
    await expect(chatBox.locator('.message')).toHaveCount(4);

    // Clear chat
    await page.evaluate(() => {
      window.chatApp.chatBox.clear();
    });

    // Should have only welcome message
    await expect(chatBox.locator('.message')).toHaveCount(1);
    await expect(chatBox.locator('.system-message')).toContainText('Welcome!');
  });

  test('should scroll to bottom when new messages are added', async ({ page }) => {
    // Add enough messages to make the chat box scrollable
    for (let i = 0; i < 10; i++) {
      await page.evaluate((index) => {
        window.chatApp.chatBox.addUserMessage(`Message ${index}`);
        window.chatApp.chatBox.addMessage(`Response ${index}`, 'bot-message');
      }, i);
      await page.waitForTimeout(50); // Small delay for smooth scrolling
    }

    // Check scroll position is at bottom
    const scrollTop = await page.evaluate(() => {
      const chatBox = document.getElementById('chatBox');
      return chatBox.scrollTop;
    });

    const scrollHeight = await page.evaluate(() => {
      const chatBox = document.getElementById('chatBox');
      return chatBox.scrollHeight;
    });

    const clientHeight = await page.evaluate(() => {
      const chatBox = document.getElementById('chatBox');
      return chatBox.clientHeight;
    });

    // Should be scrolled to bottom (allowing for small rounding differences)
    expect(Math.abs(scrollTop - (scrollHeight - clientHeight))).toBeLessThan(5);
  });

  test('should export chat history correctly', async ({ page }) => {
    // Add some messages
    await page.evaluate(() => {
      window.chatApp.chatBox.addUserMessage('Hello');
      window.chatApp.chatBox.addMessage('Hi there!', 'bot-message');
      window.chatApp.chatBox.addSystem('System notification');
    });

    // Export history
    const history = await page.evaluate(() => {
      return window.chatApp.chatBox.exportHistory();
    });

    expect(history).toContain('[USER] You: Hello');
    expect(history).toContain('[AGENT] Agent: Hi there!');
    expect(history).toContain('[SYSTEM] System notification');
  });

  test('should get message count correctly', async ({ page }) => {
    // Initially should be 0 (only welcome message)
    const initialCount = await page.evaluate(() => {
      return window.chatApp.chatBox.getMessageCount();
    });
    expect(initialCount).toBe(0);

    // Add messages
    await page.evaluate(() => {
      window.chatApp.chatBox.addUserMessage('User message');
      window.chatApp.chatBox.addMessage('Bot response', 'bot-message');
      window.chatApp.chatBox.addSystem('System message');
    });

    // Should count only user and bot messages (not system)
    const finalCount = await page.evaluate(() => {
      return window.chatApp.chatBox.getMessageCount();
    });
    expect(finalCount).toBe(2);
  });

  test('should check if chat is empty correctly', async ({ page }) => {
    // Initially should be empty (only welcome message)
    let isEmpty = await page.evaluate(() => {
      return window.chatApp.chatBox.isEmpty();
    });
    expect(isEmpty).toBe(true);

    // Add a user message
    await page.evaluate(() => {
      window.chatApp.chatBox.addUserMessage('Not empty anymore');
    });

    // Should not be empty now
    isEmpty = await page.evaluate(() => {
      return window.chatApp.chatBox.isEmpty();
    });
    expect(isEmpty).toBe(false);
  });

  test('should handle message styling classes correctly', async ({ page }) => {
    await page.evaluate(() => {
      window.chatApp.chatBox.addUserMessage('User message');
      window.chatApp.chatBox.addMessage('Bot message', 'bot-message');
      window.chatApp.chatBox.addSystem('System message');
    });

    const chatBox = page.locator('#chatBox');

    // Check each message has correct class
    await expect(chatBox.locator('.message:nth-child(2)')).toHaveClass(/user-message/);
    await expect(chatBox.locator('.message:nth-child(3)')).toHaveClass(/bot-message/);
    await expect(chatBox.locator('.message:nth-child(4)')).toHaveClass(/system-message/);
  });

  test('should handle edge cases', async ({ page }) => {
    // Test with empty message
    await page.evaluate(() => {
      window.chatApp.chatBox.addMessage('', 'user-message');
    });
    // Should not add empty message
    const messagesCount1 = await page.locator('#chatBox .message').count();
    expect(messagesCount1).toBe(1); // Still only welcome message

    // Test with very long message
    const longMessage = 'A'.repeat(1000);
    await page.evaluate((msg) => {
      window.chatApp.chatBox.addUserMessage(msg);
    }, longMessage);

    await expect(page.locator('#chatBox .user-message')).toContainText(longMessage);
  });

  test('should be accessible', async ({ page }) => {
    // Check chat box has proper structure for screen readers
    const chatBox = page.locator('#chatBox');
    await expect(chatBox).toHaveAttribute('role', 'log');

    // Check messages have proper ARIA attributes (if implemented)
    // This would depend on the specific accessibility implementation
  });

  test('should maintain message order', async ({ page }) => {
    const messages = [
      { text: 'First user', type: 'user-message' },
      { text: 'First bot', type: 'bot-message' },
      { text: 'Second user', type: 'user-message' },
      { text: 'Second bot', type: 'bot-message' },
      { text: 'System alert', type: 'system-message' }
    ];

    // Add messages in order
    for (const msg of messages) {
      await page.evaluate((message) => {
        if (message.type === 'user-message') {
          window.chatApp.chatBox.addUserMessage(message.text);
        } else {
          window.chatApp.chatBox.addMessage(message.text, message.type);
        }
      }, msg);
      await page.waitForTimeout(10);
    }

    // Verify order is maintained
    const chatMessages = await page.locator('#chatBox .message').allTextContents();

    // Should contain messages in correct order (excluding welcome)
    expect(chatMessages[1]).toContain('You: First user');
    expect(chatMessages[2]).toContain('Agent: First bot');
    expect(chatMessages[3]).toContain('You: Second user');
    expect(chatMessages[4]).toContain('Agent: Second bot');
    expect(chatMessages[5]).toContain('System alert');
  });
});
