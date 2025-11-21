/**
 * Application Constants
 * Central configuration for the FastAPI Agent Chat application
 */

export const API_ENDPOINTS = {
    CHAT: '/api/v1/chat',
    STOP: '/api/v1/stop'
};

export const MESSAGE_TYPES = {
    USER: 'user-message',
    BOT: 'bot-message',
    SYSTEM: 'system-message'
};

export const STATUS_TYPES = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    ERROR: 'error'
};

export const UI_STATES = {
    DEFAULT_CHAT_ID: 'test-chat-001',
    WELCOME_MESSAGE: 'Welcome! Enter a message and click Send to start chatting with the agent.',
    CHAT_CLEARED_MESSAGE: 'Chat cleared. Enter a new message to start.'
};

export const STREAM_EVENTS = {
    DONE: '[DONE]',
    STOPPED: '[STOPPED]',
    ERROR_PREFIX: '[ERROR]'
};

export const CSS_CLASSES = {
    CONTAINER: 'container',
    CHAT_BOX: 'chat-box',
    MESSAGE: 'message',
    INPUT_GROUP: 'input-group',
    CONTROLS: 'controls',
    STATUS: 'status',
    INFO_BOX: 'info-box'
};
