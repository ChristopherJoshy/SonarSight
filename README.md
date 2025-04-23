# SonarSight: AI-Powered Text Analysis Extension

SonarSight is a Chrome extension that provides AI-powered insights and analysis for any text you select on the web. It leverages both Google's Gemini API and Perplexity's Sonar API to deliver comprehensive, cited summaries and insights.

## Features

- 🧠 AI-powered text analysis with multiple providers (Google Gemini & Perplexity)
- 📝 Intelligent follow-up question suggestions based on content analysis
- 📚 Citations with source links for fact-checking
- 📁 Notebook functionality to save important insights
- 📊 History tracking of all your queries
- ⚙️ Customizable settings with your own API keys

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

## Technical Details

- Frontend: HTML, CSS, JavaScript (Chrome Extension)
- Backend: Node.js, Express
- AI Providers: Google Gemini API, Perplexity API

## Privacy

- Your API keys and analyzed text are stored locally in your browser's storage
- No data is sent to our servers - all API requests go directly to the AI providers
- Debug mode can be enabled/disabled in settings

## Troubleshooting

- If you encounter errors, check that your API keys are entered correctly
- Ensure the backend server is running (for local installation)
- Try switching between AI providers
- Check the Chrome developer console for error messages

## License

MIT License