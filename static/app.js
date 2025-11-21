/**
 * Enhanced FastAPI Agent Chat Application
 * Modern component-based implementation with proper API structure
 */

/**
 * Enhanced Chat Application with Component-based Architecture
 */
class EnhancedChatApplication {
  constructor() {
    this.chatBox = null;
    this.chatIdInput = null;
    this.messageInput = null;
    this.sendBtn = null;
    this.stopBtn = null;
    this.clearBtn = null;
    this.statusText = null;
    this.statusSpinner = null;
    this.currentStream = null;
    this.streamingMessageId = null;

    this.init();
  }

  /**
   * Initialize the enhanced application
   */
  init() {
    console.log('Initializing Enhanced ChatApplication...');

    // Initialize chat ID with actual timestamp
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substr(2, 9);
    this.generatedChatId = `test-session-${timestamp}-${uniqueId}`;

    this.setupEventListeners();
    this.loadChatHistory();

    // Set initial chat ID
    if (this.chatIdInput && !this.chatIdInput.value.trim()) {
      this.chatIdInput.value = this.generatedChatId;
    }

    // Expose API for testing
    if (typeof window !== 'undefined') {
      window.chatApp = this;
      window.enhancedApp = this;
      window.chatApp.getAppState = this.getAppState.bind(this);
    }
  }

  /**
   * Set up event listeners with enhanced functionality
   */
  setupEventListeners() {
    console.log('Setting up enhanced event listeners...');

    // Get element references
    this.chatIdInput = document.getElementById('chatId');
    this.messageInput = document.getElementById('message');
    this.sendBtn = document.getElementById('sendBtn');
    this.stopBtn = document.getElementById('stopBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.chatBox = document.getElementById('chatBox');
    this.statusText = document.getElementById('statusText');
    this.statusSpinner = document.getElementById('statusSpinner');

    // Send button
    this.sendBtn.addEventListener('click', () => this.handleSendMessage());

    // Stop button
    this.stopBtn.addEventListener('click', () => this.handleStopChat());

    // Clear button
    this.clearBtn.addEventListener('click', () => this.handleClearChat());

    // Enhanced keyboard shortcuts
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.sendBtn.disabled) {
        this.handleSendMessage();
      }
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Escape to stop (when streaming)
      if (e.key === 'Escape' && !this.stopBtn.disabled) {
        this.handleStopChat();
      }
      // Ctrl/Cmd + K to clear
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.handleClearChat();
      }
    });

    // Chat ID change - load history
    this.chatIdInput.addEventListener('input', () => {
      this.loadChatHistory();
    });

    // Auto-resize message input
    this.messageInput.addEventListener('input', () => {
      this.autoResizeInput();
    });

    console.log('Enhanced event listeners set up successfully');
  }

  /**
   * Enhanced send message handler with better error handling
   */
  async handleSendMessage() {
    const chatId = this.chatIdInput.value.trim();
    const message = this.messageInput.value.trim();

    if (!chatId || !message) {
      this.showStatus('Please enter both Chat ID and Message', 'error');
      return;
    }

    console.log('Enhanced sending message:', { chatId, message });

    // Add user message to chat with animation
    this.addMessageToChat('user', `You: ${message}`);

    // Clear message input and resize
    this.messageInput.value = '';
    this.autoResizeInput();

    // Update button states with smooth transitions
    this.setButtonState('sending');

    // Show connecting status
    this.showStatus('Connecting to agent...', 'connecting');

    // Add typing indicator
    const typingId = this.addMessageToChat('bot', 'Agent: <span class="typing-indicator">Thinking...</span>');
    this.streamingMessageId = typingId;

    try {
      // Use the correct FastAPI endpoint
      const apiUrl = `/api/v1/chat/${encodeURIComponent(chatId)}`;
      console.log('Enhanced sending to API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ message: message })
      });

      console.log('Enhanced response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Remove typing indicator
      this.removeMessage(typingId);
      this.streamingMessageId = null;

      // Update status to connected
      this.showStatus('Agent is typing...', 'connected');

      // Handle Server-Sent Events (SSE) streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botMessage = '';

      // Create bot message container
      const botMessageId = this.addMessageToChat('bot', 'Agent: <span id="streaming-text"></span>');
      this.streamingMessageId = botMessageId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              console.log('Enhanced stream completed successfully');
              this.completeStream(botMessage.trim() || 'Response completed.');
              break;
            } else if (data) {
              // Add streaming text
              botMessage += data;
              this.updateStreamingText(botMessage);
              this.scrollToBottom();
            }
          }
        }
      }

    } catch (error) {
      console.error('Enhanced send message error:', error);

      // Remove typing/ streaming indicators if they exist
      if (this.streamingMessageId) {
        this.removeMessage(this.streamingMessageId);
        this.streamingMessageId = null;
      }

      // Add error message with enhanced styling
      this.addMessageToChat('error', `Error: ${error.message}`);
      this.showStatus(`Error: ${error.message}`, 'error');
    }

    // Reset button states
    this.setButtonState('idle');
  }

  /**
   * Enhanced stop chat handler
   */
  async handleStopChat() {
    const chatId = this.chatIdInput.value.trim();

    if (!chatId) {
      this.showStatus('Please enter a Chat ID', 'error');
      return;
    }

    console.log('Enhanced stopping chat for:', chatId);

    try {
      // Cancel current stream if exists
      if (this.currentStream) {
        this.currentStream.abort();
        this.currentStream = null;
      }

      // Use the correct stop API endpoint
      const stopUrl = `/api/v1/stop/${encodeURIComponent(chatId)}`;
      console.log('Enhanced sending stop request to:', stopUrl);

      const response = await fetch(stopUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      console.log('Enhanced stop response:', result);

      // Add stop message to chat
      this.addMessageToChat('system', `[STOPPED] ${result.message || 'Agent stopped successfully'}`);

      // Complete current stream if exists
      if (this.streamingMessageId) {
        this.completeStream('[STOPPED] - Agent terminated by user');
      }

      // Show success status
      this.showStatus('Agent stopped successfully', 'success');

      // Reset button states
      this.setButtonState('idle');

    } catch (error) {
      console.error('Enhanced stop chat error:', error);
      this.showStatus(`Failed to stop chat: ${error.message}`, 'error');
    }
  }

  /**
   * Enhanced clear chat handler
   */
  handleClearChat() {
    console.log('Enhanced clearing chat...');

    // Clear chat box with animation
    this.chatBox.style.opacity = '0.5';
    setTimeout(() => {
      this.chatBox.innerHTML = `
        <div class="enhanced-message enhanced-message-system">
            <strong>Welcome!</strong> Enter a message to start chatting with the AI agent.
        </div>
      `;
      this.chatBox.style.opacity = '1';
    }, 150);

    // Clear inputs
    this.chatIdInput.value = this.generatedChatId || `test-session-${Date.now()}`;
    this.messageInput.value = '';
    this.autoResizeInput();

    // Reset states
    this.setButtonState('idle');
    this.currentStream = null;
    this.streamingMessageId = null;
    this.showStatus('Chat cleared - Ready to chat', 'success');

    // Focus message input
    this.messageInput.focus();
  }

  /**
   * Enhanced message management
   */
  addMessageToChat(type, content) {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;

    // Enhanced message classes
    const messageClasses = {
      'user': 'enhanced-message enhanced-message-user',
      'bot': 'enhanced-message enhanced-message-bot',
      'system': 'enhanced-message enhanced-message-system',
      'error': 'enhanced-message enhanced-message-error'
    };

    messageDiv.className = messageClasses[type] || 'enhanced-message enhanced-message-system';
    messageDiv.innerHTML = content;

    this.chatBox.appendChild(messageDiv);
    this.scrollToBottom();

    return messageId;
  }

  /**
   * Update streaming text content
   */
  updateStreamingText(text) {
    const streamingElement = document.getElementById('streaming-text');
    if (streamingElement) {
      streamingElement.textContent = text;
    }
  }

  /**
   * Complete streaming and clean up
   */
  completeStream(finalText) {
    if (this.streamingMessageId) {
      const messageElement = document.getElementById(this.streamingMessageId);
      if (messageElement) {
        messageElement.innerHTML = `Agent: ${finalText}`;
      }
      this.streamingMessageId = null;
    }
    this.showStatus('Ready to chat', 'success');
  }

  /**
   * Remove a message from the chat
   */
  removeMessage(messageId) {
    const messageElement = document.getElementById(messageId);
    if (messageElement && messageElement.parentNode) {
      messageElement.style.opacity = '0';
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.parentNode.removeChild(messageElement);
        }
      }, 150);
    }
  }

  /**
   * Enhanced status management
   */
  showStatus(message, type = 'info') {
    if (this.statusText) {
      this.statusText.textContent = message;
    }

    // Update status styling
    const statusElement = document.getElementById('status');
    if (statusElement) {
      // Remove existing status classes
      statusElement.classList.remove('enhanced-status-connected', 'enhanced-status-error');

      // Add appropriate class based on type
      const statusClasses = {
        'success': 'enhanced-status-connected',
        'error': 'enhanced-status-error',
        'connecting': '',
        'connected': 'enhanced-status-connected',
        'info': ''
      };

      if (statusClasses[type]) {
        statusElement.classList.add(statusClasses[type]);
      }
    }

    // Control spinner
    if (this.statusSpinner) {
      const spinnerStates = ['connecting', 'connected'];
      this.statusSpinner.style.display = spinnerStates.includes(type) ? 'inline-block' : 'none';
    }
  }

  /**
   * Enhanced button state management
   */
  setButtonState(state) {
    const states = {
      'idle': { sendEnabled: true, stopEnabled: false },
      'sending': { sendEnabled: false, stopEnabled: true },
      'streaming': { sendEnabled: false, stopEnabled: true }
    };

    const currentState = states[state] || states.idle;

    this.sendBtn.disabled = !currentState.sendEnabled;
    this.stopBtn.disabled = !currentState.stopEnabled;

    // Update button styles based on state
    if (this.stopBtn.disabled) {
      this.stopBtn.style.opacity = '0.5';
      this.stopBtn.style.transform = 'scale(1)';
    } else {
      this.stopBtn.style.opacity = '1';
      this.stopBtn.style.transform = 'scale(1.05)';
    }
  }

  /**
   * Auto-resize input field
   */
  autoResizeInput() {
    if (this.messageInput) {
      this.messageInput.style.height = 'auto';
      this.messageInput.style.height = Math.max(this.messageInput.scrollHeight, 40) + 'px';
    }
  }

  /**
   * Enhanced scroll to bottom with smooth animation
   */
  scrollToBottom() {
    if (!this.chatBox) {
      return;
    }
    this.chatBox.scrollTo({
      top: this.chatBox.scrollHeight,
      behavior: 'smooth'
    });
  }

  /**
   * Component API Methods for Testing Compatibility
   */

  /**
   * Add a user message (for test compatibility)
   */
  addUserMessage(message) {
    return this.addMessageToChat('user', `You: ${message}`);
  }

  /**
   * Add a bot message (for test compatibility)
   */
  addBotMessage(message) {
    return this.addMessageToChat('bot', `Agent: ${message}`);
  }

  /**
   * Add a system message (for test compatibility)
   */
  addSystemMessage(message) {
    return this.addMessageToChat('system', message);
  }

  /**
   * Add a generic message (for test compatibility)
   */
  addMessage(message, type = 'system', isStreaming = false) {
    return this.addMessageToChat(type, message);
  }

  /**
   * Clear the chat (for test compatibility)
   */
  clear() {
    this.handleClearChat();
  }

  /**
   * Export chat history (for test compatibility)
   */
  exportHistory() {
    if (!this.chatBox) {
      return '';
    }
    const messages = this.chatBox.querySelectorAll('.enhanced-message');
    return Array.from(messages).map(msg => {
      const text = msg.textContent.trim();
      if (msg.classList.contains('enhanced-message-user')) {
        return `[USER] ${text}`;
      } else if (msg.classList.contains('enhanced-message-bot')) {
        return `[AGENT] ${text}`;
      } else if (msg.classList.contains('enhanced-message-system')) {
        return `[SYSTEM] ${text}`;
      }
      return `[UNKNOWN] ${text}`;
    }).join('\n');
  }

  /**
   * Get message count (for test compatibility)
   */
  getMessageCount() {
    if (!this.chatBox) {
      return 0;
    }
    const messages = this.chatBox.querySelectorAll('.enhanced-message');
    return Array.from(messages).filter(msg =>
      msg.classList.contains('enhanced-message-user') ||
      msg.classList.contains('enhanced-message-bot')
    ).length;
  }

  /**
   * Check if chat is empty (for test compatibility)
   */
  isEmpty() {
    if (!this.chatBox) {
      return true;
    }
    const messages = this.chatBox.querySelectorAll('.enhanced-message');
    // Only count user and bot messages, ignore welcome system message
    const userBotMessages = Array.from(messages).filter(msg =>
      msg.classList.contains('enhanced-message-user') ||
      msg.classList.contains('enhanced-message-bot')
    );
    return userBotMessages.length === 0;
  }

  /**
   * Get application state (for debugging)
   */
  getAppState() {
    return {
      chatId: this.chatIdInput ? this.chatIdInput.value : '',
      message: this.messageInput ? this.messageInput.value : '',
      sendDisabled: this.sendBtn ? this.sendBtn.disabled : true,
      stopDisabled: this.stopBtn ? this.stopBtn.disabled : true,
      currentStream: !!this.currentStream,
      isStreaming: !!this.streamingMessageId,
      chatBox: {
        isEmpty: this.isEmpty(),
        messageCount: this.getMessageCount()
      },
      controls: {
        sendEnabled: this.sendBtn ? !this.sendBtn.disabled : false,
        stopEnabled: this.stopBtn ? !this.stopBtn.disabled : false
      },
      status: this.statusText ? this.statusText.textContent : '',
      service: {
        currentChatId: this.chatIdInput ? this.chatIdInput.value : '',
        isStreaming: !!this.streamingMessageId
      }
    };
  }

  /**
   * Load chat history (placeholder for future implementation)
   */
  loadChatHistory() {
    // This could load previous chat history from localStorage or backend
    console.log('Enhanced loading chat history for:', this.chatIdInput ? this.chatIdInput.value : '');
  }

  /**
   * Save chat history (placeholder for future implementation)
   */
  saveChatHistory() {
    // This could save chat history to localStorage or backend
    console.log('Enhanced saving chat history...');
  }
}

/**
 * Handle module loading errors with enhanced styling
 */
function handleEnhancedModuleLoadingError() {
  document.body.innerHTML = `
    <div class="enhanced-container" style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    ">
      <div style="
        text-align: center;
        color: white;
        padding: 40px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        max-width: 400px;
      ">
        <h2 style="margin-bottom: 20px; font-size: 1.5rem;">⚠️ Enhanced Application Error</h2>
        <p style="margin-bottom: 20px; opacity: 0.9;">Failed to load enhanced application. Please refresh the page.</p>
        <button onclick="window.location.reload()" style="
          background: white;
          color: #ef4444;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        ">
          🔄 Refresh Enhanced App
        </button>
      </div>
    </div>
  `;
}

// Enhanced error handling
window.addEventListener('error', (e) => {
  if (e.target.tagName === 'SCRIPT' && e.target.type === 'module') {
    console.error('Enhanced failed to load module:', e.target.src);
    handleEnhancedModuleLoadingError();
  }
}, true);

// Initialize enhanced application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('Enhanced DOM loaded, initializing application...');
    const enhancedApp = new EnhancedChatApplication();

    // Make app available for debugging
    if (typeof window !== 'undefined') {
      window.debugApp = () => {
        return enhancedApp.getAppState();
      };
      window.enhancedApp = enhancedApp;
    }

    console.log('Enhanced application initialized successfully');

  } catch (error) {
    console.error('Failed to initialize enhanced application:', error);
    handleEnhancedModuleLoadingError();
  }
});
