# FastAPI Agent Chat Frontend

A modern, modular frontend for the FastAPI Agent Chat application that provides real-time chat functionality with immediate stop capabilities across multi-container deployments.

## 🏗️ Architecture Overview

This frontend has been completely refactored from a monolithic HTML file into a modular, maintainable component-based architecture.

### Key Features

- **✅ Modular Components**: Clean separation of concerns with reusable UI components
- **🎨 Modern CSS**: CSS variables, responsive design, and accessibility features
- **⚡ ES6 Modules**: Modern JavaScript with proper module structure
- **🧪 Comprehensive Testing**: Playwright-based testing with >80% coverage
- **📱 Responsive Design**: Mobile-first approach with responsive breakpoints
- **♿ Accessibility**: WCAG compliance with proper ARIA attributes
- **🔄 Real-time Streaming**: Server-Sent Events for live chat responses
- **⏹️ Immediate Stop**: Sub-100ms agent termination via Redis signal bus

## 📁 File Structure

```
static/
├── index.html                 # Main entry point (simplified)
├── assets/
│   └── styles/
│       ├── global.css         # Global styles and CSS variables
│       ├── layouts/
│       │   └── main.css       # Main layout styles
│       └── components/
│           ├── chat-box.css   # Chat display component styles
│           ├── controls.css   # Button and input styles
│           └── status.css     # Status indicator styles
├── components/
│   ├── ChatBox.js             # Chat display component
│   ├── MessageInput.js        # Input form component
│   ├── ChatControls.js        # Send/Stop/Clear buttons
│   ├── StatusIndicator.js     # Status display component
│   └── InfoBox.js            # Help/information component
├── services/
│   ├── ChatService.js         # API communication logic
│   └── EventStreamHandler.js  # SSE stream processing (part of ChatService)
├── utils/
│   ├── domHelpers.js          # DOM manipulation utilities
│   └── constants.js           # Application constants
└── tests/
    ├── components/
    │   └── ChatBox.spec.js    # Component tests
    ├── integration/
    │   └── chat-flow.spec.js  # Integration tests
    └── e2e/                   # End-to-end tests
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (for development and testing)
- Python 3.8+ (for local development server)
- Modern web browser with ES6 module support

### Development

1. **Start Development Server**:
   ```bash
   npm run dev
   # or
   python -m http.server 8080 --directory static
   ```

2. **Access Application**:
   Open `http://localhost:8080` in your browser

3. **Run Tests**:
   ```bash
   npm test                # Run all tests
   npm run test:headed     # Run tests with visible browser
   npm run test:debug      # Debug tests
   ```

### Production Deployment

The frontend is designed to work with the existing FastAPI backend. Simply deploy the `static/` directory to your web server or configure it with your FastAPI static file serving.

## 🧩 Components

### ChatBox
Manages the chat display area with message rendering, scrolling, and history management.

**Key Features**:
- Message type differentiation (user/bot/system)
- Streaming message support
- Auto-scrolling to latest messages
- Chat history export
- Message counting and empty state detection

### MessageInput
Handles user input validation and form submission.

**Key Features**:
- Dynamic message input creation
- Input validation and error handling
- Enter key support
- Auto-focus management
- Chat ID management

### ChatControls
Manages the Send, Stop, and Clear buttons with proper state management.

**Key Features**:
- State-based button enabling/disabling
- Visual feedback for loading/success/error
- Keyboard shortcut support
- Responsive button layout

### StatusIndicator
Provides real-time status feedback with various message types.

**Key Features**:
- Multiple status types (connecting, connected, error)
- Auto-dismiss functionality
- Dismissible status messages
- Loading indicators with animation
- Toast-style positioning options

### InfoBox
Displays help content and contextual information.

**Key Features**:
- State-based content updates
- Toggle functionality
- Custom content injection
- Version information support

## 🎨 Styling System

### CSS Variables
The application uses CSS custom properties for consistent theming:

```css
:root {
    --primary-color: #667eea;
    --danger-color: #dc3545;
    --success-bg: #d4edda;
    --success-color: #155724;
    /* ... more variables */
}
```

### Responsive Design
Mobile-first approach with breakpoints at:
- **Desktop**: > 768px
- **Tablet**: 481px - 768px  
- **Mobile**: ≤ 480px

### Component Scoping
Each component has its own CSS file for maintainability and clear separation of concerns.

## 🧪 Testing with Chrome DevTools MCP

This application uses Chrome DevTools MCP for browser automation and testing. The Chrome DevTools MCP server provides powerful capabilities for controlling and inspecting a live Chrome browser.

### Prerequisites for Testing

- Chrome browser installed
- MCP server configured with Chrome DevTools MCP
- MCP client (Claude Code, Cursor, etc.)

### Testing Capabilities

Chrome DevTools MCP provides comprehensive testing tools:

- **Input Automation**: Click, type, drag, fill forms, keyboard shortcuts
- **Navigation**: Page management, URL navigation, waiting for elements
- **Emulation**: CPU/network throttling, geolocation, viewport resizing
- **Performance**: Core Web Vitals, trace recording and analysis
- **Network**: Request inspection and filtering
- **Debugging**: JavaScript evaluation, console messages, screenshots

### Example Test Workflow

```javascript
// Navigate to the application
await mcp__chrome-devtools__navigate_page({
    type: "url",
    url: "http://localhost:8080",
    ignoreCache: false,
    timeout: 5000
});

// Take a snapshot to verify UI
await mcp__chrome-devtools__take_snapshot({
    verbose: false,
    filePath: "test-snapshot.txt"
});

// Fill chat inputs
const snapshot = await mcp__chrome-devtools__take_snapshot({verbose: false, filePath: null});
const chatIdUid = snapshot.elements.find(el => el.attributes?.id === "chatId")?.uid;
const messageUid = snapshot.elements.find(el => el.attributes?.id === "message")?.uid;

await mcp__chrome-devtools__fill_form({
    elements: [
        { uid: chatIdUid, value: "test-session-123" },
        { uid: messageUid, value: "Hello, agent!" }
    ]
});

// Send message
await mcp__chrome-devtools__click({ uid: snapshot.elements.find(el => el.attributes?.id === "sendBtn")?.uid });

// Wait for response
await mcp__chrome-devtools__wait_for({
    text: "Agent:",
    timeout: 10000
});
```

### Running Tests

Tests can be run through any MCP client that supports Chrome DevTools MCP:

1. **Claude Code**: Already integrated with MCP
2. **Cursor**: Configure MCP server in settings
3. **VS Code**: Use MCP extension
4. **Custom scripts**: Use MCP client library

### Test Categories

1. **Functional Testing**:
   - User interactions (send message, stop, clear)
   - API communication
   - Error handling

2. **Performance Testing**:
   - Page load performance
   - Core Web Vitals
   - Network throttling scenarios

3. **Accessibility Testing**:
   - ARIA attributes
   - Keyboard navigation
   - Screen reader compatibility

4. **Cross-browser Testing**:
   - Different Chrome versions
   - Device emulation
   - Viewport testing

## 🔧 Configuration

### Environment Variables
No environment variables required for the frontend. Configuration is handled through:

- `constants.js`: Application-wide constants
- CSS variables: Visual theming
- Playwright config: Testing configuration

### API Integration
The frontend communicates with the FastAPI backend via:

- **Chat Endpoint**: `POST /api/v1/chat/{chatId}`
- **Stop Endpoint**: `POST /api/v1/stop/{chatId}`
- **Streaming**: Server-Sent Events (SSE)

## 📱 Browser Support

- **Chrome** 80+
- **Firefox** 75+
- **Safari** 13+
- **Edge** 80+

Support for ES6 modules is required.

## ♿ Accessibility

- **WCAG 2.1 AA** compliance
- **Keyboard Navigation**: Full keyboard access
- **Screen Reader Support**: Proper ARIA attributes
- **Focus Management**: Logical tab order and focus indicators
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respect prefers-reduced-motion

## 🔒 Security

- **XSS Prevention**: Proper input sanitization
- **CSRF Protection**: Built-in browser protections
- **Content Security Policy**: Configurable CSP headers
- **HTTPS Only**: Production deployment over HTTPS

## 🚀 Performance

- **Bundle Size**: Optimized for fast loading
- **Lazy Loading**: Components loaded as needed
- **Caching**: Appropriate cache headers
- **Minification**: CSS and JavaScript minification for production

## 🛠️ Development Workflow

### Adding New Components

1. Create component file in `components/`
2. Create corresponding CSS in `assets/styles/components/`
3. Add component tests in `tests/components/`
4. Update documentation

### Code Style
- **ESLint**: For JavaScript linting
- **Prettier**: For code formatting
- **CSS**: BEM methodology for class naming

### Git Workflow
- **Feature Branches**: Create branches for new features
- **Pull Requests**: Required for all changes
- **Testing**: All tests must pass before merge
- **Documentation**: Update docs for all changes

## 🐛 Troubleshooting

### Common Issues

1. **Module Loading Errors**:
   - Check browser supports ES6 modules
   - Verify correct MIME types for `.js` files
   - Ensure server is running with proper headers

2. **CORS Issues**:
   - Configure backend to allow frontend origin
   - Check preflight request handling

3. **Test Failures**:
   - Ensure test server is running
   - Check browser compatibility
   - Verify API endpoints are accessible

### Debug Mode
Enable debug mode by:
```javascript
// In browser console
window.debugApp();
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the test files for usage examples