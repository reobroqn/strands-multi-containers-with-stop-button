/**
 * ChatBox Component
 * Manages the chat display area and message rendering
 */

import { MESSAGE_TYPES, UI_STATES } from '../utils/constants.js';
import { addMessageToChat, getElement } from '../utils/domHelpers.js';

export class ChatBox {
  constructor(containerId = 'chatBox') {
    this.container = getElement(containerId);
    this.init();
  }

  /**
   * Initialize the chat box with welcome message
   */
  init() {
    if (!this.container) {
      throw new Error(`ChatBox container with id '${containerId}' not found`);
    }
    this.clear();
  }

  /**
   * Add a message to the chat
   * @param {string} message - Message content
   * @param {string} type - Message type (user, bot, system)
   * @param {boolean} isStreaming - Whether this is a streaming message
   */
  addMessage(message, type = MESSAGE_TYPES.BOT, isStreaming = false) {
    if (!this.container) return;

    if (isStreaming) {
      // For streaming messages, update the last bot message
      const lastMessage = this.container.lastElementChild;
      if (lastMessage && lastMessage.classList.contains(MESSAGE_TYPES.BOT)) {
        lastMessage.textContent += message;
      } else {
        addMessageToChat(`Agent: ${message}`, type, this.container);
      }
    } else {
      const prefix = type === MESSAGE_TYPES.USER ? 'You: ' :
        type === MESSAGE_TYPES.BOT ? 'Agent: ' : '';
      addMessageToChat(`${prefix}${message}`, type, this.container);
    }

    this.scrollToBottom();
  }

  /**
   * Add a user message
   * @param {string} message - User message content
   */
  addUserMessage(message) {
    this.addMessage(message, MESSAGE_TYPES.USER);
  }

  /**
   * Start a new bot message for streaming
   * @returns {HTMLElement} The message element for updates
   */
  startBotMessage() {
    if (!this.container) return null;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${MESSAGE_TYPES.BOT}`;
    messageDiv.textContent = 'Agent: ';
    this.container.appendChild(messageDiv);

    this.scrollToBottom();
    return messageDiv;
  }

  /**
   * Update a streaming bot message
   * @param {HTMLElement} messageElement - Message element to update
   * @param {string} content - New content to append
   */
  updateBotMessage(messageElement, content) {
    if (messageElement) {
      messageElement.textContent += content;
      this.scrollToBottom();
    }
  }

  /**
   * Clear all messages and show welcome message
   */
  clear() {
    if (!this.container) return;

    this.container.innerHTML = '';
    this.addMessage(UI_STATES.WELCOME_MESSAGE, MESSAGE_TYPES.SYSTEM);
  }

  /**
   * Get all messages in the chat
   * @returns {HTMLElement[]} Array of message elements
   */
  getMessages() {
    if (!this.container) return [];

    return Array.from(this.container.querySelectorAll('.message'));
  }

  /**
   * Get the last message in the chat
   * @returns {HTMLElement|null} Last message element
   */
  getLastMessage() {
    if (!this.container) return null;

    return this.container.lastElementChild;
  }

  /**
   * Check if the chat is empty (only has welcome message)
   * @returns {boolean} True if chat is essentially empty
   */
  isEmpty() {
    const messages = this.getMessages();
    return messages.length <= 1; // Only welcome message or empty
  }

  /**
   * Scroll to the bottom of the chat
   */
  scrollToBottom() {
    if (this.container) {
      this.container.scrollTop = this.container.scrollHeight;
    }
  }

  /**
   * Get message count (excluding system messages)
   * @returns {number} Number of user/bot messages
   */
  getMessageCount() {
    const messages = this.getMessages();
    return messages.filter(msg =>
      !msg.classList.contains(MESSAGE_TYPES.SYSTEM)
    ).length;
  }

  /**
   * Export chat history as text
   * @returns {string} Chat history as formatted text
   */
  exportHistory() {
    const messages = this.getMessages();
    return messages
      .map(msg => {
        const text = msg.textContent.trim();
        const type = msg.classList.contains(MESSAGE_TYPES.USER) ? 'USER' :
          msg.classList.contains(MESSAGE_TYPES.BOT) ? 'AGENT' : 'SYSTEM';
        return `[${type}] ${text}`;
      })
      .join('\n');
  }
}
