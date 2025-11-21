/**
 * ChatControls Component
 * Manages the Send, Stop, and Clear buttons
 */

import { getElement } from '../utils/domHelpers.js';

export class ChatControls {
  constructor(options = {}) {
    this.sendBtn = getElement('sendBtn');
    this.stopBtn = getElement('stopBtn');
    this.clearBtn = null; // Will be created if not exists

    this.onSend = options.onSend || (() => { });
    this.onStop = options.onStop || (() => { });
    this.onClear = options.onClear || (() => { });

    this.init();
  }

  /**
   * Initialize the control buttons
   */
  init() {
    this.createButtons();
    this.setupEventListeners();
    this.resetToInitialState();
  }

  /**
   * Create buttons if they don't exist
   */
  createButtons() {
    // Find or create controls container
    let controlsContainer = getElement('controls') ||
      document.querySelector('.controls');

    if (!controlsContainer) {
      controlsContainer = document.createElement('div');
      controlsContainer.className = 'controls';

      // Insert before the info box if it exists
      const infoBox = document.querySelector('.info-box');
      if (infoBox) {
        infoBox.parentNode.insertBefore(controlsContainer, infoBox);
      } else {
        // Fallback: append to container
        const container = document.querySelector('.container');
        if (container) {
          container.appendChild(controlsContainer);
        }
      }
    }

    // Create Send button if not exists
    if (!this.sendBtn) {
      this.sendBtn = this.createButton('sendBtn', 'Send Message', 'send-btn');
      controlsContainer.appendChild(this.sendBtn);
    }

    // Create Stop button if not exists
    if (!this.stopBtn) {
      this.stopBtn = this.createButton('stopBtn', '⏹️ Stop Agent', 'stop-btn');
      controlsContainer.appendChild(this.stopBtn);
    }

    // Create Clear button if not exists
    if (!this.clearBtn) {
      this.clearBtn = this.createButton('clearBtn', 'Clear Chat', 'clear-btn');
      controlsContainer.appendChild(this.clearBtn);
    }
  }

  /**
   * Create a button element
   * @param {string} id - Button ID
   * @param {string} text - Button text
   * @param {string} className - CSS class name
   * @returns {HTMLElement} Button element
   */
  createButton(id, text, className) {
    const button = document.createElement('button');
    button.id = id;
    button.className = className;
    button.textContent = text;
    return button;
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => {
        this.onSend();
      });
    }

    if (this.stopBtn) {
      this.stopBtn.addEventListener('click', () => {
        this.onStop();
      });
    }

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        this.onClear();
      });
    }
  }

  /**
   * Set buttons to their initial state
   */
  resetToInitialState() {
    this.setSendEnabled(true);
    this.setStopEnabled(false);
    this.setClearEnabled(true);
  }

  /**
   * Enable/disable send button
   * @param {boolean} enabled - Whether to enable the button
   */
  setSendEnabled(enabled) {
    if (this.sendBtn) {
      this.sendBtn.disabled = !enabled;
    }
  }

  /**
   * Enable/disable stop button
   * @param {boolean} enabled - Whether to enable the button
   */
  setStopEnabled(enabled) {
    if (this.stopBtn) {
      this.stopBtn.disabled = !enabled;
    }
  }

  /**
   * Enable/disable clear button
   * @param {boolean} enabled - Whether to enable the button
   */
  setClearEnabled(enabled) {
    if (this.clearBtn) {
      this.clearBtn.disabled = !enabled;
    }
  }

  /**
   * Set buttons for active chat state
   */
  setActiveChatState() {
    this.setSendEnabled(false);
    this.setStopEnabled(true);
    this.setClearEnabled(false); // Disable clear during active chat
  }

  /**
   * Set buttons for idle state
   */
  setIdleState() {
    this.setSendEnabled(true);
    this.setStopEnabled(false);
    this.setClearEnabled(true);
  }

  /**
   * Set buttons for error state
   */
  setErrorState() {
    this.setSendEnabled(true);
    this.setStopEnabled(false);
    this.setClearEnabled(true);
  }

  /**
   * Set loading state with visual feedback
   * @param {boolean} loading - Whether to show loading state
   */
  setLoading(loading) {
    if (this.sendBtn) {
      if (loading) {
        this.sendBtn.textContent = 'Sending...';
        this.sendBtn.disabled = true;
      } else {
        this.sendBtn.textContent = 'Send Message';
        this.sendBtn.disabled = false;
      }
    }
  }

  /**
   * Update button text
   * @param {string} buttonId - Button ID
   * @param {string} text - New button text
   */
  updateButtonText(buttonId, text) {
    const button = getElement(buttonId);
    if (button) {
      button.textContent = text;
    }
  }

  /**
   * Add visual feedback to a button
   * @param {string} buttonId - Button ID
   * @param {string} feedbackClass - CSS class for feedback
   */
  addFeedback(buttonId, feedbackClass) {
    const button = getElement(buttonId);
    if (button) {
      button.classList.add(feedbackClass);
      setTimeout(() => {
        button.classList.remove(feedbackClass);
      }, 2000);
    }
  }

  /**
   * Get current state of all buttons
   * @returns {Object} Current button states
   */
  getState() {
    return {
      sendEnabled: this.sendBtn ? !this.sendBtn.disabled : null,
      stopEnabled: this.stopBtn ? !this.stopBtn.disabled : null,
      clearEnabled: this.clearBtn ? !this.clearBtn.disabled : null,
      hasSendBtn: !!this.sendBtn,
      hasStopBtn: !!this.stopBtn,
      hasClearBtn: !!this.clearBtn
    };
  }

  /**
   * Show/hide the stop button with animation
   * @param {boolean} show - Whether to show the stop button
   */
  showStopButton(show) {
    if (this.stopBtn) {
      if (show) {
        this.stopBtn.style.display = 'inline-block';
        setTimeout(() => {
          this.stopBtn.style.opacity = '1';
        }, 10);
      } else {
        this.stopBtn.style.opacity = '0';
        setTimeout(() => {
          this.stopBtn.style.display = 'none';
        }, 300);
      }
    }
  }

  /**
   * Focus the send button
   */
  focusSendButton() {
    if (this.sendBtn && !this.sendBtn.disabled) {
      this.sendBtn.focus();
    }
  }

  /**
   * Disable all buttons
   */
  disableAll() {
    this.setSendEnabled(false);
    this.setStopEnabled(false);
    this.setClearEnabled(false);
  }

  /**
   * Enable all buttons
   */
  enableAll() {
    this.setSendEnabled(true);
    this.setStopEnabled(true);
    this.setClearEnabled(true);
  }
}
