/**
 * Event Stream Handler
 * Processes streaming responses from the chat API
 */

import { STREAM_EVENTS } from '../utils/constants.js';

export class EventStreamHandler {
  constructor(onChunk, onComplete, onError, onStop) {
    this.onChunk = onChunk || (() => { });
    this.onComplete = onComplete || (() => { });
    this.onError = onError || (() => { });
    this.onStop = onStop || (() => { });
    this.isProcessing = false;
  }

  /**
   * Process streaming response from fetch API
   * @param {Response} response - Fetch response object
   * @param {HTMLElement} messageElement - Element to update with content
   */
  async processStream(response, messageElement) {
    if (!response?.body) {
      this.onError('Invalid response body');
      return;
    }

    this.isProcessing = true;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (this.isProcessing) {
        const { done, value } = await reader.read();

        if (done) {
          this.onComplete();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!this.isProcessing) break;

          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            await this.handleStreamData(data, messageElement);
          }
        }
      }
    } catch (error) {
      if (this.isProcessing) {
        this.onError(`Stream processing error: ${error.message}`);
      }
    } finally {
      reader.releaseLock();
      this.isProcessing = false;
    }
  }

  /**
   * Handle individual stream data items
   * @param {string} data - Stream data item
   * @param {HTMLElement} messageElement - Element to update
   */
  async handleStreamData(data, messageElement) {
    if (!data) return;

    switch (data) {
      case STREAM_EVENTS.DONE:
        this.onComplete();
        break;

      case STREAM_EVENTS.STOPPED:
        if (messageElement) {
          messageElement.textContent += '\n\n[Response stopped by user]';
        }
        this.onStop();
        break;

      case data.startsWith(STREAM_EVENTS.ERROR_PREFIX):
        if (messageElement) {
          messageElement.textContent += `\n\n${data}`;
        }
        this.onError(data);
        break;

      default:
        // Regular content chunk
        this.onChunk(data);
        if (messageElement) {
          messageElement.textContent += data;
        }
        break;
    }
  }

  /**
   * Stop processing the stream
   */
  stop() {
    this.isProcessing = false;
  }

  /**
   * Check if currently processing a stream
   * @returns {boolean} Processing status
   */
  isActive() {
    return this.isProcessing;
  }

  /**
   * Reset the handler state
   */
  reset() {
    this.stop();
    // Clear callbacks
    this.onChunk = () => { };
    this.onComplete = () => { };
    this.onError = () => { };
    this.onStop = () => { };
  }
}

export default EventStreamHandler;
