/**
 * InfoBox Component
 * Manages the help/information box
 */

export class InfoBox {
  constructor(containerId = 'infoBox') {
    this.container = document.getElementById(containerId) ||
      document.querySelector('.info-box');
    this.isVisible = true;
    this.init();
  }

  /**
   * Initialize the info box
   */
  init() {
    if (!this.container) {
      this.createInfoBox();
    }
  }

  /**
   * Create the info box if it doesn't exist
   */
  createInfoBox() {
    this.container = document.createElement('div');
    this.container.className = 'info-box';
    this.container.id = 'infoBox';

    // Set default content
    this.setContent(this.getDefaultContent());

    // Add to the end of the main container
    const mainContainer = document.querySelector('.container');
    if (mainContainer) {
      mainContainer.appendChild(this.container);
    }
  }

  /**
   * Get the default info box content
   * @returns {string} Default HTML content
   */
  getDefaultContent() {
    return `
            <h3>How to Test the Stop Button:</h3>
            <ul>
                <li>1. Enter a message and click "Send Message"</li>
                <li>2. While the agent is responding, click "Stop Agent"</li>
                <li>3. The agent should stop immediately (within ~100ms)</li>
                <li>4. Notice the [STOPPED] message appears</li>
                <li>5. You can send another message to continue the chat</li>
            </ul>
            <p style="margin-top: 10px;"><strong>Architecture:</strong> Nginx → Multiple FastAPI backends → Redis (signal bus)</p>
        `;
  }

  /**
   * Set the content of the info box
   * @param {string} content - HTML content to set
   */
  setContent(content) {
    if (!this.container) return;

    this.container.innerHTML = content;
    this.isVisible = true;
  }

  /**
   * Update the title of the info box
   * @param {string} title - New title text
   */
  setTitle(title) {
    if (!this.container) return;

    const heading = this.container.querySelector('h3');
    if (heading) {
      heading.textContent = title;
    } else {
      // Create heading if it doesn't exist
      const newHeading = document.createElement('h3');
      newHeading.textContent = title;
      this.container.insertBefore(newHeading, this.container.firstChild);
    }
  }

  /**
   * Add a new section to the info box
   * @param {string} title - Section title
   * @param {string} content - Section content (HTML)
   */
  addSection(title, content) {
    if (!this.container) return;

    const section = document.createElement('div');
    section.className = 'info-section';
    section.innerHTML = `
            <h4>${title}</h4>
            <div class="info-section-content">${content}</div>
        `;

    this.container.appendChild(section);
  }

  /**
   * Add a list of instructions
   * @param {string} title - List title
   * @param {Array<string>} items - List items
   * @param {boolean} ordered - Whether to use ordered list
   */
  addInstructionList(title, items, ordered = false) {
    if (!this.container) return;

    const listType = ordered ? 'ol' : 'ul';
    const listItems = items.map(item => `<li>${item}</li>`).join('');

    const section = `
            <h4>${title}</h4>
            <${listType}>
                ${listItems}
            </${listType}>
        `;

    this.addSection(title, section);
  }

  /**
   * Show the info box
   */
  show() {
    if (!this.container) return;

    this.container.style.display = 'block';
    this.isVisible = true;
  }

  /**
   * Hide the info box
   */
  hide() {
    if (!this.container) return;

    this.container.style.display = 'none';
    this.isVisible = false;
  }

  /**
   * Toggle visibility of the info box
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Add a toggle button to the info box
   * @param {string} buttonText - Button text
   */
  addToggleButton(buttonText = 'Toggle Help') {
    if (!this.container) return;

    // Remove existing toggle button
    const existingBtn = this.container.querySelector('.info-toggle');
    if (existingBtn) {
      existingBtn.remove();
    }

    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'info-toggle';
    toggleBtn.textContent = buttonText;
    toggleBtn.addEventListener('click', () => {
      this.toggle();
    });

    // Insert at the beginning of the info box
    this.container.insertBefore(toggleBtn, this.container.firstChild);
  }

  /**
   * Set content for different application states
   * @param {string} state - Application state
   */
  setContentForState(state) {
    switch (state) {
      case 'welcome':
        this.setContent(this.getDefaultContent());
        break;

      case 'chatting':
        this.setContent(`
                    <h3>Chat Tips:</h3>
                    <ul>
                        <li>• Click "Stop Agent" to interrupt the response</li>
                        <li>• Use "Clear Chat" to start a new conversation</li>
                        <li>• Messages are preserved in your current session</li>
                    </ul>
                    <p style="margin-top: 10px;"><em>Agent is responding...</em></p>
                `);
        break;

      case 'error':
        this.setContent(`
                    <h3>Connection Issue</h3>
                    <p>There was a problem connecting to the agent. Please try again.</p>
                    <ul>
                        <li>• Check your internet connection</li>
                        <li>• Try sending a different message</li>
                        <li>• Clear the chat and start over</li>
                    </ul>
                `);
        break;

      case 'success':
        this.setContent(`
                    <h3>Success!</h3>
                    <p>Your message was sent successfully and the agent has responded.</p>
                    <p style="margin-top: 10px;">You can continue the conversation or start a new one.</p>
                `);
        break;

      default:
        this.setContent(this.getDefaultContent());
    }
  }

  /**
   * Update the architecture information
   * @param {string} architectureInfo - New architecture description
   */
  updateArchitectureInfo(architectureInfo) {
    if (!this.container) return;

    const architectureP = this.container.querySelector('p strong');
    if (architectureP && architectureP.textContent.includes('Architecture:')) {
      architectureP.parentNode.innerHTML =
        `<p style="margin-top: 10px;"><strong>Architecture:</strong> ${architectureInfo}</p>`;
    }
  }

  /**
   * Add version information
   * @param {string} version - Application version
   */
  addVersionInfo(version) {
    if (!this.container) return;

    const versionDiv = document.createElement('div');
    versionDiv.className = 'version-info';
    versionDiv.style.cssText = 'margin-top: 15px; font-size: 11px; color: #666;';
    versionDiv.textContent = `Version: ${version}`;

    this.container.appendChild(versionDiv);
  }

  /**
   * Add keyboard shortcuts information
   */
  addKeyboardShortcuts() {
    const shortcuts = [
      'Enter - Send message',
      'Escape - Stop agent (when active)',
      'Ctrl/Cmd + K - Clear chat'
    ];

    this.addInstructionList('Keyboard Shortcuts', shortcuts);
  }

  /**
   * Style the info box with custom CSS
   * @param {Object} styles - CSS properties object
   */
  setStyles(styles) {
    if (!this.container) return;

    Object.assign(this.container.style, styles);
  }

  /**
   * Get the current visibility state
   * @returns {boolean} Whether the info box is visible
   */
  getVisibility() {
    return this.isVisible;
  }

  /**
   * Get the content of the info box
   * @returns {string} Current HTML content
   */
  getContent() {
    return this.container ? this.container.innerHTML : '';
  }

  /**
   * Clear all content from the info box
   */
  clear() {
    if (!this.container) return;

    this.container.innerHTML = '';
  }

  /**
   * Remove the info box from the DOM
   */
  destroy() {
    if (!this.container) return;

    this.container.remove();
    this.container = null;
    this.isVisible = false;
  }
}
