/**
 * Chat Service
 * Handles API communication with the FastAPI backend
 */

import { API_ENDPOINTS, STREAM_EVENTS } from '../utils/constants.js';

export class ChatService {
  constructor() {
    this.currentChatId = null;
    this.abortController = null;
  }

  /**
   * Send a message to the chat API
   * @param {string} chatId - Chat session ID
   * @param {string} message - Message content
   * @returns {Promise<Response>} Fetch response
   */
  async sendMessage(chatId, message) {
    this.currentChatId = chatId;
    this.abortController = new AbortController();

    try {
      const response = await fetch(`${API_ENDPOINTS.CHAT}/${chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        throw new Error('Request was aborted');
      }
      throw error;
    }
  }

  /**
   * Send stop signal to the current chat
   * @returns {Promise<Object>} API response
   */
  async stopChat() {
    if (!this.currentChatId) {
      throw new Error('No active chat to stop');
    }

    const response = await fetch(`${API_ENDPOINTS.STOP}/${this.currentChatId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Abort the current streaming request
   */
  abortRequest() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Process streaming response from the API
   * @param {Response} response - Fetch response object
   * @param {Function} onChunk - Callback for each chunk of data
   * @param {Function} onComplete - Callback when stream completes
   * @param {Function} onError - Callback for errors
   * @returns {Promise<void>}
   */
  async processStream(response, onChunk, onComplete, onError) {
    try {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === STREAM_EVENTS.DONE) {
              onComplete();
              return;
            } else if (data === STREAM_EVENTS.STOPPED) {
              onChunk('\n\n[Response stopped by user]', true);
              onComplete();
              return;
            } else if (data.startsWith(STREAM_EVENTS.ERROR_PREFIX)) {
              onError(data);
              return;
            } else if (data) {
              onChunk(data, false);
            }
          }
        }
      }
    } catch (error) {
      onError(`Stream processing error: ${error.message}`);
    }
  }

  /**
   * Get the current chat ID
   * @returns {string|null} Current chat session ID
   */
  getCurrentChatId() {
    return this.currentChatId;
  }

  /**
   * Reset the chat service state
   */
  reset() {
    this.currentChatId = null;
    this.abortController = null;
  }
}
