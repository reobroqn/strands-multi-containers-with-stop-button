# Chrome DevTools MCP Testing Guide

## Overview

This document explains how to test the FastAPI Agent Chat frontend using Chrome DevTools MCP. Chrome DevTools MCP is a powerful Model Context Protocol server that allows AI agents to control and inspect a live Chrome browser.

## Migration from Playwright

We've migrated from Playwright to Chrome DevTools MCP for several reasons:
- Better integration with AI coding assistants
- More flexible automation capabilities
- No need for browser binaries (uses your existing Chrome)
- Token-optimized responses for efficient AI interaction

## Test Structure

### Functional Tests

Tests are organized by functionality:

1. **App Loading Tests**
   - Verify the application loads correctly
   - Check for proper UI initialization
   - Validate initial state

2. **Chat Functionality Tests**
   - Send messages
   - Receive streaming responses
   - Verify message display

3. **Stop Functionality Tests**
   - Test agent termination
   - Verify stop signals work
   - Check UI state changes

4. **UI Interaction Tests**
   - Button states
   - Keyboard shortcuts
   - Form validation

5. **Error Handling Tests**
   - Network errors
   - Invalid inputs
   - Server errors

## Test Examples

### Basic Test Flow

```javascript
// Test: App loads and is ready
async function testAppLoading() {
    // Navigate to app
    await mcp__chrome-devtools__navigate_page({
        type: "url",
        url: "http://localhost:8080",
        ignoreCache: true,
        timeout: 5000
    });

    // Take snapshot
    const snapshot = await mcp__chrome-devtools__take_snapshot({
        verbose: false,
        filePath: null
    });

    // Verify elements exist
    const chatIdInput = snapshot.elements.find(el => el.attributes?.id === "chatId");
    const messageInput = snapshot.elements.find(el => el.attributes?.id === "message");
    const sendBtn = snapshot.elements.find(el => el.attributes?.id === "sendBtn");

    if (!chatIdInput || !messageInput || !sendBtn) {
        throw new Error("Required UI elements not found");
    }

    console.log("✅ App loaded successfully");
}
```

### Chat Functionality Test

```javascript
// Test: Send and receive message
async function testChatFlow() {
    // Fill chat form
    const snapshot = await mcp__chrome-devtools__take_snapshot({verbose: false, filePath: null});
    
    const chatId = snapshot.elements.find(el => el.attributes?.id === "chatId")?.uid;
    const message = snapshot.elements.find(el => el.attributes?.id === "message")?.uid;
    
    await mcp__chrome-devtools__fill_form({
        elements: [
            { uid: chatId, value: "test-" + Date.now() },
            { uid: message, value: "What is 2+2?" }
        ]
    });

    // Send message
    await mcp__chrome-devtools__click({
        uid: snapshot.elements.find(el => el.attributes?.id === "sendBtn")?.uid
    });

    // Wait for response
    await mcp__chrome-devtools__wait_for({
        text: "Agent:",
        timeout: 10000
    });

    console.log("✅ Chat flow test passed");
}
```

### Performance Test

```javascript
// Test: Performance metrics
async function testPerformance() {
    // Start performance trace
    await mcp__chrome-devtools__performance_start_trace({
        reload: true,
        autoStop: true
    });

    // Wait for trace to complete
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("✅ Performance trace captured");
}
```

### Network Request Test

```javascript
// Test: API communication
async function testAPICommunication() {
    // Clear any existing requests
    await mcp__chrome-devtools__navigate_page({
        type: "url",
        url: "http://localhost:8080",
        ignoreCache: true,
        timeout: 5000
    });

    // Trigger API call
    // ... send message code ...

    // Check network requests
    const requests = await mcp__chrome-devtools__list_network_requests({
        pageSize: 10,
        pageIdx: 0,
        resourceTypes: ["xhr", "fetch"],
        includePreservedRequests: false
    });

    const chatRequest = requests.find(req => 
        req.url.includes("/api/v1/chat/")
    );

    if (!chatRequest) {
        throw new Error("Chat API request not found");
    }

    console.log("✅ API communication test passed");
}
```

## Running Tests

### Setup

1. **Install Chrome DevTools MCP**:
   Follow the installation guide at https://github.com/chromedevtools/chrome-devtools-mcp

2. **Configure MCP Client**:
   ```json
   {
     "mcpServers": {
       "chrome-devtools": {
         "command": "npx",
         "args": ["-y", "@chromedevtools/chrome-devtools-mcp"]
       }
     }
   }
   ```

3. **Start the Application**:
   ```bash
   cd static
   python -m http.server 8080
   ```

### Execution

Tests can be run in several ways:

1. **Interactive Testing**:
   - Use Claude Code with Chrome DevTools MCP
   - Write test code in conversation
   - Execute step by step

2. **Automated Testing**:
   - Create test scripts
   - Run with MCP client
   - Collect results

3. **CI/CD Integration**:
   - Use MCP in GitHub Actions
   - Run tests on PRs
   - Report results

## Best Practices

1. **Wait Strategies**:
   - Use `wait_for` for dynamic content
   - Set appropriate timeouts
   - Handle race conditions

2. **Error Handling**:
   - Check for element existence
   - Validate responses
   - Log failures clearly

3. **Test Isolation**:
   - Clear state between tests
   - Use unique chat IDs
   - Avoid test dependencies

4. **Performance**:
   - Use snapshots efficiently
   - Minimize unnecessary actions
   - Reuse browser sessions when possible

## Advanced Usage

### Emulating Different Conditions

```javascript
// Test slow network
await mcp__chrome-devtools__emulate({
    networkConditions: "Slow 3G",
    cpuThrottlingRate: 4
});

// Test mobile viewport
await mcp__chrome-devtools__resize_page({
    width: 375,
    height: 667
});

// Test geolocation
await mcp__chrome-devtools__emulate({
    networkConditions: "No emulation",
    cpuThrottlingRate: 1,
    geolocation: {
        latitude: 37.7749,
        longitude: -122.4194
    }
});
```

### Debugging

```javascript
// Take screenshot for debugging
await mcp__chrome-devtools__take_screenshot({
    format: "png",
    quality: 100,
    fullPage: true,
    filePath: "debug-screenshot.png"
});

// Check console errors
const consoleErrors = await mcp__chrome-devtools__list_console_messages({
    pageSize: 20,
    pageIdx: 0,
    types: ["error"],
    includePreservedMessages: true
});

// Evaluate JavaScript
const result = await mcp__chrome-devtools__evaluate_script({
    function: "() => window.chatApp.getAppState()"
});
```

## Conclusion

Chrome DevTools MCP provides a powerful and flexible testing solution that integrates seamlessly with AI assistants. It offers better ergonomics for test authoring and execution compared to traditional testing frameworks.