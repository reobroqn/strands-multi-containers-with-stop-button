/**
 * MessageInput Component
 * Manages the message input form and validation
 */

// Default values (replacing external constants.js)
const DEFAULT_CHAT_ID = 'test-chat-1';

// Utility functions (replacing external domHelpers.js)
function getElement(id) {
  return document.getElementById(id);
}

function createInputGroup(id, labelText, placeholder) {
  const group = document.createElement('div');
  group.className = 'input-group';

  const label = document.createElement('label');
  label.textContent = labelText;
  label.setAttribute('for', id);

  const input = document.createElement('input');
  input.type = 'text';
  input.id = id;
  input.placeholder = placeholder;

  group.appendChild(label);
  group.appendChild(input);

  return group;
}

export class MessageInput {
  constructor(options = {}) {
    this.chatIdInput = null;
    this.messageInput = null;
    this.onSubmit = options.onSubmit || (() => { });
    this.onChatIdChange = options.onChatIdChange || (() => { });

    this.init();
  }

  /**
   * Initialize the input components
   */
  init() {
    this.createChatIdInput();
    this.setupEnterKeyHandler();
  }

  /**
   * Create or get the chat ID input
   */
  createChatIdInput() {
    this.chatIdInput = getElement('chatId');

    if (!this.chatIdInput) {
      const chatInputGroup = createInputGroup(
        'chatId',
        'Chat ID',
        'Enter a unique chat ID'
      );

      // Insert at the beginning of the container
      const container = getElement('.container');
      if (container) {
        const h1 = container.querySelector('h1');
        const subtitle = container.querySelector('.subtitle');
        if (subtitle) {
          subtitle.parentNode.insertBefore(chatInputGroup, subtitle.nextSibling);
        } else if (h1) {
          h1.parentNode.insertBefore(chatInputGroup, h1.nextSibling);
        }
      }

      this.chatIdInput = getElement('chatId');
    }

    // Set default value
    if (this.chatIdInput && !this.chatIdInput.value) {
      this.chatIdInput.value = DEFAULT_CHAT_ID;
    }

    // Add change listener
    if (this.chatIdInput) {
      this.chatIdInput.addEventListener('input', () => {
        this.onChatIdChange(this.getChatId());
      });
    }
  }

  /**
   * Get or create the message input
   * @returns {HTMLElement} Message input element
   */
  getMessageInput() {
    if (!this.messageInput) {
      this.messageInput = getElement('messageInput');

      if (!this.messageInput) {
        const messageInputGroup = createInputGroup(
          'messageInput',
          'Message',
          'Type your message here...'
        );

        // Insert after chat ID input
        if (this.chatIdInput) {
          this.chatIdInput.parentNode.parentNode.insertBefore(
            messageInputGroup,
            this.chatIdInput.parentNode.nextSibling
          );
        }

        this.messageInput = getElement('messageInput');
      }
    }

    return this.messageInput;
  }

  /**
   * Validate input fields
   * @returns {Object} Validation result with isValid and error properties
   */
  validateInputs() {
    const chatId = this.getChatId().trim();
    const message = this.getMessage().trim();

    if (!chatId) {
      return {
        isValid: false,
        error: 'Please enter a Chat ID',
        field: 'chatId'
      };
    }

    if (!message) {
      return {
        isValid: false,
        error: 'Please enter a message',
        field: 'message'
      };
    }

    return {
      isValid: true,
      error: null,
      field: null
    };
  }

  /**
   * Get the current chat ID
   * @returns {string} Chat ID value
   */
  getChatId() {
    return this.chatIdInput ? this.chatIdInput.value : '';
  }

  /**
   * Get the current message
   * @returns {string} Message content
   */
  getMessage() {
    const messageInput = this.getMessageInput();
    return messageInput ? messageInput.value : '';
  }

  /**
   * Clear the message input
   */
  clearMessage() {
    const messageInput = this.getMessageInput();
    if (messageInput) {
      messageInput.value = '';
    }
  }

  /**
   * Clear both inputs
   */
  clearAll() {
    this.clearMessage();
    if (this.chatIdInput) {
      this.chatIdInput.value = DEFAULT_CHAT_ID;
    }
  }

  /**
   * Focus the message input
   */
  focusMessage() {
    const messageInput = this.getMessageInput();
    if (messageInput) {
      messageInput.focus();
    }
  }

  /**
   * Set the chat ID
   * @param {string} chatId - New chat ID value
   */
  setChatId(chatId) {
    if (this.chatIdInput) {
      this.chatIdInput.value = chatId;
      this.onChatIdChange(chatId);
    }
  }

  /**
   * Enable or disable inputs
   * @param {boolean} disabled - Whether to disable inputs
   */
  setDisabled(disabled) {
    if (this.chatIdInput) {
      this.chatIdInput.disabled = disabled;
    }

    const messageInput = this.getMessageInput();
    if (messageInput) {
      messageInput.disabled = disabled;
    }
  }

  /**
   * Set up Enter key handler for message input
   */
  setupEnterKeyHandler() {
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const messageInput = this.getMessageInput();
        if (messageInput && document.activeElement === messageInput) {
          e.preventDefault();
          this.handleSubmit();
        }
      }
    });
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    const validation = this.validateInputs();

    if (!validation.isValid) {
      this.showError(validation.error);
      return;
    }

    const chatId = this.getChatId();
    const message = this.getMessage();

    // Clear message input after submission
    this.clearMessage();

    // Call the submit callback
    try {
      await this.onSubmit(chatId, message);
    } catch (error) {
      // Restore message if submission failed
      this.restoreMessage(message);
      this.showError(`Submission failed: ${error.message}`);
    }
  }

  /**
   * Show error message
   * @param {string} error - Error message
   */
  showError(error) {
    // This would integrate with a status component
    console.error('Input error:', error);

    // For now, use alert (could be replaced with better UI)
    if (typeof window !== 'undefined' && window.alert) {
      alert(error);
    }
  }

  /**
   * Restore message to input (used when submission fails)
   * @param {string} message - Message to restore
   */
  restoreMessage(message) {
    const messageInput = this.getMessageInput();
    if (messageInput) {
      messageInput.value = message;
    }
  }

  /**
   * Get input state for debugging
   * @returns {Object} Current input state
   */
  getState() {
    return {
      chatId: this.getChatId(),
      message: this.getMessage(),
      hasChatIdInput: !!this.chatIdInput,
      hasMessageInput: !!this.getMessageInput(),
      chatIdDisabled: this.chatIdInput ? this.chatIdInput.disabled : null,
      messageDisabled: this.getMessageInput() ? this.getMessageInput().disabled : null
    };
  }
}
