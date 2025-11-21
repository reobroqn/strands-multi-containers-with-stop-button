/**
 * Critical Test 5: Error Handling and Application Resilience
 * Tests graceful failure handling and edge cases
 */

import { test, expect } from '@playwright/test';

test.describe('Error Handling and Resilience', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000/');
    await page.waitForLoadState('networkidle');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Monitor for error states
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });

    // Try to send message with invalid chat ID that might cause API errors
    await page.fill('#chatId', 'invalid-chat-id-with-special-chars!@#$');
    await page.fill('#message', 'Test error handling');

    // Send message and handle potential errors
    await page.click('#sendBtn');

    // Wait to see if error appears or message succeeds
    await page.waitForTimeout(5000);

    // Check if application remains functional
    const appState = await page.evaluate(() => {
      try {
        return window.chatApp.getAppState();
      } catch (error) {
        return { error: error.message };
      }
    });

    expect(appState.error).toBeUndefined();
    await expect(page.locator('#sendBtn')).toBeVisible();
    await expect(page.locator('#clearBtn')).toBeVisible();
  });

  test('should handle rapid user interactions without breaking', async ({ page }) => {
    // Rapid button clicking
    const clearBtn = page.locator('#clearBtn');

    for (let i = 0; i < 10; i++) {
      await clearBtn.click();
      await page.waitForTimeout(50);
    }

    // Should still be functional
    await expect(clearBtn).toBeVisible();
    await expect(page.locator('#chatBox')).toBeVisible();

    // Rapid form filling
    await page.fill('#chatId', 'rapid-test');
    await page.fill('#message', 'Rapid interaction test');

    // Should be able to send message
    await expect(page.locator('#sendBtn')).toBeEnabled();
  });

  test('should handle invalid input gracefully', async ({ page }) => {
    // Test very long inputs
    const veryLongText = 'A'.repeat(10000);

    await page.fill('#chatId', veryLongText);
    await page.fill('#message', veryLongText);

    // Application should remain responsive
    const appState = await page.evaluate(() => {
      try {
        return window.chatApp.getAppState();
      } catch (error) {
        return { error: error.message };
      }
    });

    expect(appState.error).toBeUndefined();
    expect(appState.chatId).toBe(veryLongText);
    expect(appState.message).toBe(veryLongText);

    // Test special characters
    await page.fill('#chatId', 'test-with-special-chars-!@#$%^&*()');
    await page.fill('#message', 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?');

    // Should handle without errors
    await expect(page.locator('#sendBtn')).toBeVisible();
  });

  test('should maintain application state during errors', async ({ page }) => {
    // Start with some activity
    await page.fill('#chatId', 'state-test');
    await page.fill('#message', 'Test state preservation');

    let appState1 = await page.evaluate(() => window.chatApp.getAppState());

    // Trigger potential error
    await page.click('#sendBtn');
    await page.waitForTimeout(1000);
    await page.click('#stopBtn');

    // Check state is consistent
    let appState2 = await page.evaluate(() => window.chatApp.getAppState());

    expect(appState2.error).toBeUndefined();
    expect(appState2.chatId).toBe('state-test');
    expect(appState2.controls.sendEnabled).toBe(true);
    expect(appState2.controls.stopEnabled).toBe(false);

    // Clear and verify state resets properly
    await page.click('#clearBtn');

    let appState3 = await page.evaluate(() => window.chatApp.getAppState());
    expect(appState3.chatBox.isEmpty).toBe(true);
    expect(appState3.message).toBe('');
  });

  test('should provide debugging information for development', async ({ page }) => {
    // Verify debugging functions are available
    const debugInfo = await page.evaluate(() => {
      try {
        return window.debugApp();
      } catch (error) {
        return { error: error.message };
      }
    });

    expect(debugInfo.error).toBeUndefined();
    expect(debugInfo).toHaveProperty('chatId');
    expect(debugInfo).toHaveProperty('sendDisabled');
    expect(debugInfo).toHaveProperty('stopDisabled');

    // Verify enhanced app is accessible
    const enhancedAppExists = await page.evaluate(() => {
      return window.chatApp !== undefined;
    });

    expect(enhancedAppExists).toBe(true);
  });
});
