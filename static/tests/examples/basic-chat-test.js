/**
 * Basic Chat Functionality Test
 * Example test using Chrome DevTools MCP
 */

// Test: Basic chat flow
async function testBasicChatFlow() {
  console.log("🧪 Starting basic chat flow test...");

  try {
    // Step 1: Navigate to the application
    console.log("📍 Navigating to app...");
    await mcp__chrome - devtools__navigate_page({
      type: "url",
      url: "http://localhost:8080",
      ignoreCache: true,
      timeout: 5000
    });

    // Step 2: Verify UI elements are present
    console.log("🔍 Checking UI elements...");
    const snapshot = await mcp__chrome - devtools__take_snapshot({
      verbose: false,
      filePath: null
    });

    const requiredElements = ["chatId", "message", "sendBtn", "stopBtn", "clearBtn"];
    const missingElements = [];

    requiredElements.forEach(id => {
      const element = snapshot.elements.find(el => el.attributes?.id === id);
      if (!element) {
        missingElements.push(id);
      }
    });

    if (missingElements.length > 0) {
      throw new Error(`Missing UI elements: ${missingElements.join(", ")}`);
    }

    console.log("✅ All UI elements found");

    // Step 3: Fill in chat details
    console.log("✍️ Filling chat form...");
    const chatIdUid = snapshot.elements.find(el => el.attributes?.id === "chatId")?.uid;
    const messageUid = snapshot.elements.find(el => el.attributes?.id === "message")?.uid;

    const testChatId = `test-${Date.now()}`;
    const testMessage = "Hello agent! What is 2 + 2?";

    await mcp__chrome - devtools__fill_form({
      elements: [
        { uid: chatIdUid, value: testChatId },
        { uid: messageUid, value: testMessage }
      ]
    });

    // Step 4: Send the message
    console.log("📤 Sending message...");
    const sendBtnUid = snapshot.elements.find(el => el.attributes?.id === "sendBtn")?.uid;
    await mcp__chrome - devtools__click({ uid: sendBtnUid });

    // Step 5: Verify message appears in chat
    console.log("👀 Checking chat for user message...");
    await mcp__chrome - devtools__wait_for({
      text: testMessage,
      timeout: 5000
    });

    console.log("✅ User message appeared in chat");

    // Step 6: Wait for agent response
    console.log("⏳ Waiting for agent response...");
    await mcp__chrome - devtools__wait_for({
      text: "Agent:",
      timeout: 15000
    });

    console.log("✅ Agent response received");

    // Step 7: Verify stop button is enabled during response
    console.log("🔘 Checking button states...");
    const updatedSnapshot = await mcp__chrome - devtools__take_snapshot({
      verbose: false,
      filePath: null
    });

    const stopBtn = updatedSnapshot.elements.find(el => el.attributes?.id === "stopBtn");
    const sendBtnDisabled = stopBtn?.attributes?.disabled === null;

    if (!sendBtnDisabled) {
      throw new Error("Stop button should be enabled during streaming");
    }

    console.log("✅ Button states are correct");

    // Step 8: Test the stop functionality
    console.log("⏹️ Testing stop functionality...");
    await mcp__chrome - devtools__click({ uid: stopBtn?.uid });

    await mcp__chrome - devtools__wait_for({
      text: "[STOPPED]",
      timeout: 5000
    });

    console.log("✅ Agent stopped successfully");

    // Step 9: Test clear functionality
    console.log("🗑️ Testing clear functionality...");
    const clearBtnUid = updatedSnapshot.elements.find(el => el.attributes?.id === "clearBtn")?.uid;
    await mcp__chrome - devtools__click({ uid: clearBtnUid });

    // Verify chat is cleared
    await mcp__chrome - devtools__wait_for({
      text: "Welcome!",
      timeout: 3000
    });

    console.log("✅ Chat cleared successfully");

    console.log("🎉 All tests passed!");
    return {
      success: true,
      message: "Basic chat flow test completed successfully",
      testChatId: testChatId
    };

  } catch (error) {
    console.error("❌ Test failed:", error);

    // Take screenshot for debugging
    await mcp__chrome - devtools__take_screenshot({
      format: "png",
      quality: 100,
      fullPage: true,
      filePath: "test-failure-screenshot.png"
    });

    return {
      success: false,
      message: error.message,
      error: error
    };
  }
}

// Test: Keyboard shortcuts
async function testKeyboardShortcuts() {
  console.log("⌨️ Testing keyboard shortcuts...");

  try {
    // Navigate to app
    await mcp__chrome - devtools__navigate_page({
      type: "url",
      url: "http://localhost:8080",
      ignoreCache: true,
      timeout: 5000
    });

    // Get message input
    const snapshot = await mcp__chrome - devtools__take_snapshot({ verbose: false, filePath: null });
    const messageUid = snapshot.elements.find(el => el.attributes?.id === "message")?.uid;

    // Focus on message input
    await mcp__chrome - devtools__click({ uid: messageUid });

    // Type a message
    await mcp__chrome - devtools__fill({
      uid: messageUid,
      value: "Test keyboard shortcuts"
    });

    // Press Enter to send
    await mcp__chrome - devtools__press_key({
      key: "Enter"
    });

    // Verify message was sent
    await mcp__chrome - devtools__wait_for({
      text: "Test keyboard shortcuts",
      timeout: 5000
    });

    console.log("✅ Enter key shortcut works");

    // Test Ctrl+K to clear
    await mcp__chrome - devtools__press_key({
      key: "Control+k"
    });

    await mcp__chrome - devtools__wait_for({
      text: "Welcome!",
      timeout: 3000
    });

    console.log("✅ Ctrl+K shortcut works");

    return {
      success: true,
      message: "Keyboard shortcuts test passed"
    };

  } catch (error) {
    console.error("❌ Keyboard shortcuts test failed:", error);
    return {
      success: false,
      message: error.message
    };
  }
}

// Test: Network request validation
async function testNetworkRequests() {
  console.log("🌐 Testing network requests...");

  try {
    // Navigate to app
    await mcp__chrome - devtools__navigate_page({
      type: "url",
      url: "http://localhost:8080",
      ignoreCache: true,
      timeout: 5000
    });

    // Send a message to trigger API call
    const snapshot = await mcp__chrome - devtools__take_snapshot({ verbose: false, filePath: null });

    await mcp__chrome - devtools__fill_form({
      elements: [
        { uid: snapshot.elements.find(el => el.attributes?.id === "chatId")?.uid, value: "network-test" },
        { uid: snapshot.elements.find(el => el.attributes?.id === "message")?.uid, value: "Test API call" }
      ]
    });

    await mcp__chrome - devtools__click({
      uid: snapshot.elements.find(el => el.attributes?.id === "sendBtn")?.uid
    });

    // Check network requests
    const requests = await mcp__chrome - devtools__list_network_requests({
      pageSize: 20,
      pageIdx: 0,
      resourceTypes: ["xhr", "fetch"],
      includePreservedRequests: false
    });

    const chatRequest = requests.find(req =>
      req.url.includes("/api/v1/chat/") && req.method === "POST"
    );

    if (!chatRequest) {
      throw new Error("Chat API request not found");
    }

    console.log("✅ API request sent successfully");

    return {
      success: true,
      message: "Network requests test passed",
      requestUrl: chatRequest.url
    };

  } catch (error) {
    console.error("❌ Network requests test failed:", error);
    return {
      success: false,
      message: error.message
    };
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting test suite...");

  const results = [];

  // Run basic chat flow test
  results.push(await testBasicChatFlow());

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Run keyboard shortcuts test
  results.push(await testKeyboardShortcuts());

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Run network requests test
  results.push(await testNetworkRequests());

  // Summary
  const passed = results.filter(r => r.success).length;
  const total = results.length;

  console.log(`\n📊 Test Summary: ${passed}/${total} tests passed`);

  results.forEach((result, index) => {
    const status = result.success ? "✅" : "❌";
    console.log(`${status} Test ${index + 1}: ${result.message}`);
  });

  return {
    passed,
    total,
    results
  };
}

// Export test functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testBasicChatFlow,
    testKeyboardShortcuts,
    testNetworkRequests,
    runAllTests
  };
}

// Uncomment to run tests directly
// runAllTests();
