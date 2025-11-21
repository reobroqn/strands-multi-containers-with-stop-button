/**
 * DOM Helper Utilities
 * Reusable DOM manipulation functions
 */

import { CSS_CLASSES, MESSAGE_TYPES } from './constants.js';

/**
 * Safely get an element by ID
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} DOM element or null
 */
export function getElement(id) {
    return document.getElementById(id);
}

/**
 * Create a message element with appropriate styling
 * @param {string} message - Message content
 * @param {string} type - Message type (user, bot, system)
 * @returns {HTMLElement} Message DOM element
 */
export function createMessageElement(message, type = MESSAGE_TYPES.SYSTEM) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    return messageDiv;
}

/**
 * Add a message to the chat box
 * @param {string} message - Message content
 * @param {string} type - Message type
 * @param {HTMLElement} chatBox - Chat container element
 */
export function addMessageToChat(message, type, chatBox = null) {
    const chatBoxElement = chatBox || getElement('chatBox');
    if (!chatBoxElement) return;

    const messageDiv = createMessageElement(message, type);
    chatBoxElement.appendChild(messageDiv);
    chatBoxElement.scrollTop = chatBoxElement.scrollHeight;
}

/**
 * Show status message with appropriate styling
 * @param {string} message - Status message
 * @param {string} type - Status type (connecting, connected, error)
 */
export function showStatus(message, type) {
    const statusDiv = getElement('status');
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.className = `status active ${type}`;
}

/**
 * Hide status message
 */
export function hideStatus() {
    const statusDiv = getElement('status');
    if (statusDiv) {
        statusDiv.className = 'status';
    }
}

/**
 * Toggle button states
 * @param {boolean} sendDisabled - Disable send button
 * @param {boolean} stopDisabled - Disable stop button
 */
export function toggleButtons(sendDisabled = false, stopDisabled = true) {
    const sendBtn = getElement('sendBtn');
    const stopBtn = getElement('stopBtn');

    if (sendBtn) sendBtn.disabled = sendDisabled;
    if (stopBtn) stopBtn.disabled = stopDisabled;
}

/**
 * Clear chat content and reset UI
 * @param {string} welcomeMessage - Optional custom welcome message
 */
export function clearChatContent(welcomeMessage = null) {
    const chatBox = getElement('chatBox');
    if (!chatBox) return;

    const message = welcomeMessage || 'Chat cleared. Enter a new message to start.';
    chatBox.innerHTML = '';
    addMessageToChat(message, MESSAGE_TYPES.SYSTEM);

    hideStatus();
    toggleButtons(false, true);
}

/**
 * Create an input group with label and input
 * @param {string} id - Input ID
 * @param {string} label - Label text
 * @param {string} placeholder - Input placeholder
 * @param {string} type - Input type (default: text)
 * @returns {HTMLElement} Input group element
 */
export function createInputGroup(id, label, placeholder, type = 'text') {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';

    const labelElement = document.createElement('label');
    labelElement.setAttribute('for', id);
    labelElement.textContent = label;

    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.placeholder = placeholder;

    inputGroup.appendChild(labelElement);
    inputGroup.appendChild(input);

    return inputGroup;
}
