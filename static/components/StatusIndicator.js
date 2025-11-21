/**
 * StatusIndicator Component
 * Manages status messages and their display
 */

import { STATUS_TYPES } from '../utils/constants.js';
import { showStatus, hideStatus, getElement } from '../utils/domHelpers.js';

export class StatusIndicator {
  constructor(containerId = 'status') {
    this.container = getElement(containerId);
    this.currentStatus = null;
    this.timeoutId = null;
    this.init();
  }

  /**
   * Initialize the status indicator
   */
  init() {
    if (!this.container) {
      this.container = this.createStatusContainer();
    }
    this.hide();
  }

  /**
   * Create status container if it doesn't exist
   * @returns {HTMLElement} Status container element
   */
  createStatusContainer() {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'status';
    statusDiv.className = 'status';

    // Insert after the input group or at the beginning of container
    const inputGroup = document.querySelector('.input-group');
    const container = document.querySelector('.container');

    if (inputGroup && inputGroup.nextSibling) {
      inputGroup.parentNode.insertBefore(statusDiv, inputGroup.nextSibling);
    } else if (container) {
      container.insertBefore(statusDiv, container.firstChild.nextSibling);
    }

    return statusDiv;
  }

  /**
   * Show a status message
   * @param {string} message - Status message
   * @param {string} type - Status type (connecting, connected, error)
   * @param {number} timeout - Optional auto-hide timeout in milliseconds
   */
  show(message, type = STATUS_TYPES.CONNECTED, timeout = null) {
    if (!this.container) return;

    this.currentStatus = { message, type };

    // Update content and styling
    this.container.textContent = message;
    this.container.className = `status active ${type}`;

    // Clear any existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Set auto-hide timeout if specified
    if (timeout && timeout > 0) {
      this.timeoutId = setTimeout(() => {
        this.hide();
      }, timeout);
    }

    // Emit status change event
    this.emitStatusChange(message, type);
  }

  /**
   * Hide the status message
   */
  hide() {
    if (!this.container) return;

    this.container.className = 'status';
    this.currentStatus = null;

    // Clear any existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.emitStatusChange(null, null);
  }

  /**
   * Show connecting status
   * @param {string} message - Optional custom message
   */
  showConnecting(message = 'Connecting...') {
    this.show(message, STATUS_TYPES.CONNECTING);
  }

  /**
   * Show connected status
   * @param {string} message - Optional custom message
   */
  showConnected(message = 'Connected') {
    this.show(message, STATUS_TYPES.CONNECTED);
  }

  /**
   * Show error status
   * @param {string} message - Error message
   * @param {number} timeout - Optional auto-hide timeout
   */
  showError(message, timeout = 5000) {
    this.show(message, STATUS_TYPES.ERROR, timeout);
  }

  /**
   * Show success status (connected with green styling)
   * @param {string} message - Success message
   * @param {number} timeout - Optional auto-hide timeout
   */
  showSuccess(message, timeout = 3000) {
    this.show(message, STATUS_TYPES.CONNECTED, timeout);
  }

  /**
   * Show loading status with animated text
   * @param {string} baseMessage - Base message without dots
   */
  showLoading(baseMessage = 'Loading') {
    let dots = 0;
    const maxDots = 3;

    const updateLoading = () => {
      const currentDots = '.'.repeat(dots + 1);
      this.show(`${baseMessage}${currentDots}`, STATUS_TYPES.CONNECTING);
      dots = (dots + 1) % maxDots;
    };

    // Show initial loading state
    updateLoading();

    // Set up interval for animated dots
    this.loadingInterval = setInterval(updateLoading, 500);
  }

  /**
   * Stop loading animation
   */
  stopLoading() {
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
      this.loadingInterval = null;
    }
  }

  /**
   * Check if status is currently visible
   * @returns {boolean} True if status is visible
   */
  isVisible() {
    return this.container &&
      this.container.classList.contains('active');
  }

  /**
   * Get current status
   * @returns {Object|null} Current status object or null
   */
  getCurrentStatus() {
    return this.currentStatus;
  }

  /**
   * Get status type
   * @returns {string|null} Current status type or null
   */
  getStatusType() {
    return this.currentStatus ? this.currentStatus.type : null;
  }

  /**
   * Check if current status is an error
   * @returns {boolean} True if current status is error
   */
  isError() {
    return this.getStatusType() === STATUS_TYPES.ERROR;
  }

  /**
   * Check if current status is connecting
   * @returns {boolean} True if current status is connecting
   */
  isConnecting() {
    return this.getStatusType() === STATUS_TYPES.CONNECTING;
  }

  /**
   * Check if current status is connected/success
   * @returns {boolean} True if current status is connected
   */
  isConnected() {
    return this.getStatusType() === STATUS_TYPES.CONNECTED;
  }

  /**
   * Set status with custom styling
   * @param {string} message - Status message
   * @param {Object} options - Additional options
   */
  setCustomStatus(message, options = {}) {
    const {
      type = STATUS_TYPES.CONNECTED,
      timeout = null,
      className = '',
      dismissible = false
    } = options;

    if (!this.container) return;

    // Update content and styling
    this.container.textContent = message;
    this.container.className = `status active ${type} ${className}`.trim();

    // Add dismissible functionality
    if (dismissible) {
      this.addDismissButton();
    }

    // Handle timeout
    if (timeout && timeout > 0) {
      this.timeoutId = setTimeout(() => {
        this.hide();
      }, timeout);
    }

    this.currentStatus = { message, type, options };
    this.emitStatusChange(message, type);
  }

  /**
   * Add dismiss button to status
   */
  addDismissButton() {
    if (!this.container) return;

    // Remove existing dismiss button
    const existingBtn = this.container.querySelector('.status-dismiss');
    if (existingBtn) {
      existingBtn.remove();
    }

    // Create dismiss button
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'status-dismiss';
    dismissBtn.innerHTML = '&times;';
    dismissBtn.addEventListener('click', () => {
      this.hide();
    });

    this.container.appendChild(dismissBtn);
  }

  /**
   * Emit status change event
   * @param {string} message - Status message
   * @param {string} type - Status type
   */
  emitStatusChange(message, type) {
    if (typeof window !== 'undefined' && window.CustomEvent) {
      const event = new CustomEvent('statusChange', {
        detail: { message, type, visible: this.isVisible() }
      });
      document.dispatchEvent(event);
    }
  }

  /**
   * Add event listener for status changes
   * @param {Function} callback - Callback function
   */
  onStatusChange(callback) {
    if (typeof window !== 'undefined') {
      document.addEventListener('statusChange', callback);
    }
  }

  /**
   * Remove event listener for status changes
   * @param {Function} callback - Callback function
   */
  offStatusChange(callback) {
    if (typeof window !== 'undefined') {
      document.removeEventListener('statusChange', callback);
    }
  }

  /**
   * Clear the status indicator and reset state
   */
  clear() {
    this.stopLoading();
    this.hide();
    this.currentStatus = null;
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    this.stopLoading();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.hide();
    this.currentStatus = null;
  }
}
