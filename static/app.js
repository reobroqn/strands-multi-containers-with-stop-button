/**
 * FastAPI Agent Chat Application
 * Main application entry point with working UI and API integration
 */

/**
 * Main Chat Application
 * Simple, working implementation that creates UI and handles API integration
 */
class ChatApplication {
  constructor() {
    this.chatBox = null;
    this.chatIdInput = null;
    this.messageInput = null;
    this.sendBtn = null;
    this.stopBtn = null;
    this.clearBtn = null;
    this.currentStream = null;

    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    console.log('Initializing ChatApplication...');
    this.createUI();
    this.setupEventListeners();
    this.loadChatHistory();
  }

  /**
   * Create all UI elements
   */
  createUI() {
    console.log('Creating UI elements...');

    // Get containers
    const inputContainer = document.getElementById('inputContainer');
    const controlsContainer = document.getElementById('controls');

    if (!inputContainer || !controlsContainer) {
      console.error('Required containers not found');
      return;
    }

    // Clear existing content
    inputContainer.innerHTML = '';
    controlsContainer.innerHTML = '';

    // Create Chat ID input
    const chatIdGroup = document.createElement('div');
    chatIdGroup.className = 'input-group';
    chatIdGroup.innerHTML = `
      <label for="chatId">Chat ID</label>
      <input type="text" id="chatId" placeholder="Enter a unique chat ID" value="test-session-${Date.now()}">
    `;

    // Create Message input
    const messageGroup = document.createElement('div');
    messageGroup.className = 'input-group';
    messageGroup.innerHTML = `
      <label for="message">Message</label>
      <input type="text" id="message" placeholder="Type your message here...">
    `;

    // Add to input container
    inputContainer.appendChild(chatIdGroup);
    inputContainer.appendChild(messageGroup);

    // Create control buttons
    const sendBtn = document.createElement('button');
    sendBtn.id = 'sendBtn';
    sendBtn.className = 'send-btn';
    sendBtn.textContent = 'Send Message';

    const stopBtn = document.createElement('button');
    stopBtn.id = 'stopBtn';
    stopBtn.className = 'stop-btn';
    stopBtn.textContent = '⏹️ Stop Agent';
    stopBtn.disabled = true;

    const clearBtn = document.createElement('button');
    clearBtn.id = 'clearBtn';
    clearBtn.className = 'clear-btn';
    clearBtn.textContent = 'Clear Chat';

    controlsContainer.appendChild(sendBtn);
    controlsContainer.appendChild(stopBtn);
    controlsContainer.appendChild(clearBtn);

    // Create chat box if it doesn't exist
    if (!document.getElementById('chatBox')) {
      const chatBox = document.createElement('div');
      chatBox.id = 'chatBox';
      chatBox.className = 'chat-box';
      chatBox.innerHTML = '<div class="system-message"><strong>Welcome!</strong> Enter a message to start chatting with the AI agent.</div>';

      // Insert after controls
      controlsContainer.parentNode.insertBefore(chatBox, controlsContainer.nextSibling);
    }

    // Get references to elements
    this.chatIdInput = document.getElementById('chatId');
    this.messageInput = document.getElementById('message');
    this.sendBtn = sendBtn;
    this.stopBtn = stopBtn;
    this.clearBtn = clearBtn;
    this.chatBox = document.getElementById('chatBox');

    console.log('UI elements created successfully');
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    console.log('Setting up event listeners...');

    // Send button
    this.sendBtn.addEventListener('click', () => this.handleSendMessage());

    // Stop button
    this.stopBtn.addEventListener('click', () => this.handleStopChat());

    // Clear button
    this.clearBtn.addEventListener('click', () => this.handleClearChat());

    // Enter key to send
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.sendBtn.disabled) {
        this.handleSendMessage();
      }
    });

    // Chat ID change
    this.chatIdInput.addEventListener('input', () => {
      this.loadChatHistory();
    });

    console.log('Event listeners set up successfully');
  }

  /**
   * Handle sending a message
   */
  async handleSendMessage() {
    const chatId = this.chatIdInput.value.trim();
    const message = this.messageInput.value.trim();

    if (!chatId || !message) {
      alert('Please enter both Chat ID and Message');
      return;
    }

    console.log('Sending message:', { chatId, message });

    // Add user message to chat
    this.addMessageToChat('user', `You: ${message}`);

    // Clear message input
    this.messageInput.value = '';

    // Update button states
    this.sendBtn.disabled = true;
    this.stopBtn.disabled = false;

    // Add typing indicator
    const typingId = this.addMessageToChat('bot', 'Agent: <span class="typing">Typing...</span>');

    try {
      // Use the correct FastAPI endpoint
      const apiUrl = `/api/v1/chat/${encodeURIComponent(chatId)}`;
      console.log('Sending to API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ message: message })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Remove typing indicator
      this.removeMessage(typingId);

      // Handle Server-Sent Events (SSE) streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botMessage = '';

      // Create bot message container
      const botMessageId = this.addMessageToChat('bot', 'Agent: <span id="streaming-text"></span>');
      const streamingText = document.getElementById('streaming-text');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              console.log('Stream completed successfully');
              if (streamingText) {
                streamingText.textContent = botMessage.trim() || 'Response completed.';
              }
              break;
            } else if (data) {
              // Add streaming text
              botMessage += data;
              if (streamingText) {
                streamingText.textContent = botMessage;
              }
              this.chatBox.scrollTop = this.chatBox.scrollHeight;
            }
          }
        }
      }

    } catch (error) {
      console.error('Send message error:', error);

      // Remove typing indicator if it exists
      this.removeMessage(typingId);

      // Add error message
      this.addMessageToChat('error', `Error: ${error.message}`);
    }

    // Reset button states
    this.sendBtn.disabled = false;
    this.stopBtn.disabled = true;
  }

  /**
   * Handle stopping the chat
   */
  async handleStopChat() {
    const chatId = this.chatIdInput.value.trim();

    if (!chatId) {
      alert('Please enter a Chat ID');
      return;
    }

    console.log('Stopping chat for:', chatId);

    try {
      // Cancel current stream if exists
      if (this.currentStream) {
        this.currentStream.abort();
        this.currentStream = null;
      }

      // Use the correct stop API endpoint
      const stopUrl = `/api/v1/stop/${encodeURIComponent(chatId)}`;
      console.log('Sending stop request to:', stopUrl);

      const response = await fetch(stopUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      console.log('Stop response:', result);

      // Add stop message to chat
      this.addMessageToChat('system', `[STOPPED] ${result.message || 'Agent stopped successfully'}`);

      // Reset button states
      this.sendBtn.disabled = false;
      this.stopBtn.disabled = true;

    } catch (error) {
      console.error('Stop chat error:', error);
      alert(`Failed to stop chat: ${error.message}`);
    }
  }

  /**
   * Handle clearing the chat
   */
  handleClearChat() {
    console.log('Clearing chat...');

    this.chatBox.innerHTML = '<div class="system-message"><strong>Welcome!</strong> Enter a message to start chatting with the AI agent.</div>';
    this.messageInput.value = '';
    this.sendBtn.disabled = false;
    this.stopBtn.disabled = true;
    this.currentStream = null;

    // Focus message input
    this.messageInput.focus();
  }

  /**
   * Add a message to the chat
   */
  addMessageToChat(type, content) {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `${type}-message`;
    messageDiv.innerHTML = content;

    this.chatBox.appendChild(messageDiv);
    this.chatBox.scrollTop = this.chatBox.scrollHeight;

    return messageId;
  }

  /**
   * Remove a message from the chat
   */
  removeMessage(messageId) {
    const messageElement = document.getElementById(messageId);
    if (messageElement && messageElement.parentNode) {
      messageElement.parentNode.removeChild(messageElement);
    }
  }

  /**
   * Load chat history (placeholder for future implementation)
   */
  loadChatHistory() {
    // This could load previous chat history from localStorage or backend
    console.log('Loading chat history for:', this.chatIdInput.value);
  }

  /**
   * Save chat history (placeholder for future implementation)
   */
  saveChatHistory() {
    // This could save chat history to localStorage or backend
    console.log('Saving chat history...');
  }
}

/**
 * Handle module loading errors
 */
function handleModuleLoadingError() {
  document.body.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: Arial, sans-serif;
      color: #721c24;
      background: #f8d7da;
      padding: 20px;
      text-align: center;
    ">
      <div>
        <h2>⚠️ Application Error</h2>
        <p>Failed to load required modules. Please refresh the page.</p>
        <button onclick="window.location.reload()" style="
          background: #721c24;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        ">
          🔄 Refresh Page
        </button>
      </div>
    </div>
  `;
}

// Error handling
window.addEventListener('error', (e) => {
  if (e.target.tagName === 'SCRIPT' && e.target.type === 'module') {
    console.error('Failed to load module:', e.target.src);
    handleModuleLoadingError();
  }
}, true);

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('DOM loaded, initializing application...');
    window.chatApp = new ChatApplication();

    // Make app available for debugging
    if (typeof window !== 'undefined') {
      window.debugApp = () => {
        return {
          chatId: window.chatApp.chatIdInput.value,
          message: window.chatApp.messageInput.value,
          sendDisabled: window.chatApp.sendBtn.disabled,
          stopDisabled: window.chatApp.stopBtn.disabled
        };
      };
    }

    console.log('Application initialized successfully');

  } catch (error) {
    console.error('Failed to initialize application:', error);
    handleModuleLoadingError();
  }
});
