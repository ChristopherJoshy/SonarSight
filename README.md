# SonarSight: AI-Powered Text Analysis Extension

SonarSight is a Chrome extension that provides AI-powered insights and analysis for any text you select on the web. It leverages both Google's Gemini API and Perplexity's Sonar API to deliver comprehensive, cited summaries and insights.

![SonarSight Logo](extension/icons/icon128.png)

## Features

- 🧠 AI-powered text analysis with multiple providers (Google Gemini & Perplexity)
- 📝 Intelligent follow-up question suggestions based on content analysis
- 📚 Citations with source links for fact-checking
- 📁 Notebook functionality to save important insights
- 📊 History tracking of all your queries
- ⚙️ Customizable settings with your own API keys
- 🌓 Light and dark theme support
- ⌨️ Keyboard shortcuts for quick access

## Installation Instructions

### Option 1: Local installation (Recommended)

1. Clone or download this repository to your computer
2. Install dependencies and start the server:
   ```
   npm install
   npm run dev
   ```
3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" using the toggle in the top-right corner
   - Click "Load unpacked" and select the `extension` folder from this repository
4. The extension icon should now appear in your Chrome toolbar
5. Click on the extension icon and go to Settings
6. Enter your API keys:
   - For Google Gemini: Get a key from [Google AI Studio](https://ai.google.dev/)
   - For Perplexity: Get a key from [Perplexity API](https://docs.perplexity.ai/)
7. Select your preferred AI provider and save settings

### Option 2: Use the hosted backend (Coming soon)

1. Follow steps 3-7 above
2. In the settings, change the Backend URL to the hosted service URL

## Usage

1. Select text on any webpage
2. Click the SonarSight extension icon or use the context menu option
3. View the AI-powered analysis and insights
4. Ask follow-up questions or save to your notebook
5. Access your saved insights and history at any time

## Requirements

- Google Chrome browser
- API Key for either Google Gemini or Perplexity
- Node.js v16+ for local installation

## Technical Architecture

SonarSight is built with a modular architecture that separates concerns and ensures maintainability. Here's a detailed breakdown of how the extension works:

### Core Components

#### 1. Content Script (`content.js`)

The content script runs in the context of web pages and is responsible for:

- **Text Selection Detection**: Monitors the page for user text selections using multiple event listeners (mouseup, keyup, selectionchange, dblclick)
- **Selection Storage**: When text is selected, it's stored in Chrome's local storage for access by other extension components
- **Visual Feedback**: Provides subtle visual cues when text is selected successfully
- **Periodic Checking**: Regularly checks for selections to ensure nothing is missed

Key functions:
- `getSelectionText()`: Retrieves selected text from the page using various methods
- `storeSelection()`: Saves the selection to Chrome storage and updates the extension badge
- `checkForSelection()`: Periodically checks if there's a text selection
- `debouncedCheckForSelection()`: Prevents excessive processing by limiting how often selection checks occur

#### 2. Popup Interface (`popup.js` and `popup_new.html`)

The popup interface is what users see when they click the extension icon:

- **Selection Display**: Shows the currently selected text
- **Analysis Interface**: Provides controls for customizing and initiating analysis
- **Results Presentation**: Displays AI-generated insights with formatting and citations
- **User Controls**: Offers buttons for saving, copying, and following up
- **Settings Management**: Allows configuration of API keys and preferences

Key functions:
- `checkForTextSelection()`: Retrieves selected text from storage
- `displaySelectedText()`: Renders the selected text in the popup UI
- `analyzeText()`: Sends text to AI services and processes the response
- `generateSuggestionChips()`: Creates context-aware suggestion buttons
- `handleFollowUpQuestion()`: Manages follow-up queries to the AI

#### 3. Background Script (`background.js`)

The background script runs persistently and handles:

- **Extension Lifecycle**: Manages installation, updates, and startup
- **Context Menu Integration**: Adds right-click menu options
- **Badge Management**: Updates the extension icon badge to indicate status
- **Global State**: Maintains state that persists across browser sessions

Key features:
- Context menu creation for quick access
- Badge indicators for selection status
- Event listeners for extension lifecycle events

### Data Flow

1. **Selection Detection**: User selects text on a webpage
2. **Content Script Processing**: The content script detects the selection and stores it in Chrome storage
3. **Storage Synchronization**: The selection data becomes available to other extension components
4. **Popup Activation**: When the user clicks the extension icon, the popup retrieves the selection
5. **Analysis Request**: The popup sends the text to the configured AI service
6. **Response Processing**: The AI response is parsed, formatted, and displayed
7. **User Interaction**: The user can interact with the results, save them, or ask follow-up questions

### State Management

SonarSight uses several mechanisms to manage state:

- **Chrome Storage**: Persistent storage for selections, settings, history, and notebook items
- **In-Memory Variables**: Temporary state for the current session
- **Flags and Trackers**: Special variables that prevent duplicate processing

Key state variables:
- `currentSelectedText`: The text currently being analyzed
- `currentResponse`: The current AI response
- `analysisInProgress`: Flag to prevent multiple simultaneous analyses
- `lastCheckedText`: Tracks the last text checked to avoid duplicates
- `lastAnalyzedText`: Tracks the last text analyzed to prevent redundant processing

### Error Prevention and Handling

The extension implements several strategies to ensure reliability:

- **Debouncing**: Limits how often selection checks and UI updates occur
- **State Tracking**: Prevents duplicate analyses and race conditions
- **Error Boundaries**: Catches and handles errors gracefully
- **Fallback Mechanisms**: Provides alternatives when primary methods fail
- **User Feedback**: Shows clear error messages and loading states

## AI Integration

SonarSight supports multiple AI providers:

### Perplexity API

- **Models**: pplx-7b-online, pplx-70b-online, and others
- **Web Search**: Real-time information retrieval
- **Citations**: Source links for fact-checking

### Google Gemini API

- **Models**: gemini-pro and others
- **Structured Responses**: Well-formatted analysis
- **Customizable Parameters**: Temperature, top_k, etc.

### API Communication

The extension communicates with AI services through:

1. **Direct API Calls**: When possible, calls are made directly to the AI provider
2. **Proxy Server**: For providers that require server-side authentication

## User Interface Components

### Main Popup

The popup interface consists of:

1. **Header**: Logo, title, and settings button
2. **Selection Display**: Shows the currently selected text
3. **Suggestion Chips**: Quick-access buttons for common analyses
4. **Custom Prompt**: Input field for custom instructions
5. **Results Area**: Displays the AI-generated analysis with formatting
6. **Action Buttons**: Controls for saving, copying, and following up

### Settings Panel

The settings interface allows configuration of:

- **API Keys**: Secure storage of provider credentials
- **Default Provider**: Selection of preferred AI service
- **UI Theme**: Light or dark mode selection
- **Advanced Options**: Model parameters and backend URL

### History and Notebook

The extension maintains:

- **Query History**: Record of past analyses with timestamps
- **Notebook**: Saved analyses for future reference
- **Export Options**: Ways to share or backup your data

## Privacy and Security

- **Local Storage**: Your API keys and data are stored locally in your browser
- **Direct Communication**: Requests go directly to AI providers (or through your local server)
- **No Tracking**: The extension doesn't collect usage data
- **Secure Handling**: API keys are handled securely and never shared

## Troubleshooting

### Common Issues

1. **Text Selection Not Detected**
   - Ensure you're selecting text on a webpage, not in the extension popup
   - Try refreshing the page and selecting again
   - Check if the extension has permission to access the current site

2. **Analysis Not Starting**
   - Verify your API keys are correctly configured
   - Check your internet connection
   - Ensure the backend server is running (for local installation)

3. **Extension Not Responding**
   - Try reloading the extension from chrome://extensions
   - Restart your browser
   - Check for console errors using Chrome DevTools

### Debugging

For advanced troubleshooting:

1. Enable debug mode in the extension settings
2. Open Chrome DevTools for the extension popup (right-click > Inspect)
3. Check the Console tab for detailed logs
4. Examine the Network tab to monitor API requests

## Development

### Project Structure

```
extension/
├── background.js       # Background script
├── content.js          # Content script for webpage integration
├── popup.js            # Popup UI logic
├── popup_new.html      # Popup UI structure
├── styles/             # CSS stylesheets
│   ├── popup.css       # Main popup styles
│   └── themes.css      # Theme-specific styles
├── icons/              # Extension icons
├── lib/                # Third-party libraries
└── manifest.json       # Extension manifest

server/                 # Optional local backend
├── server.js           # Express server for API proxying
├── routes/             # API route handlers
└── package.json        # Server dependencies
```

### Contributing

Contributions to SonarSight are welcome! To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Please follow the existing code style and add appropriate tests for new features.

## License

MIT License

---

## Contact

For support, feature requests, or bug reports, please open an issue on GitHub.

*SonarSight - Illuminating the web with AI insights*