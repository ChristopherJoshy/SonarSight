// Simple popup script for SonarSight extension

// DOM Elements
const selectedTextElement = document.getElementById('selectedText');
const loadingState = document.getElementById('loadingState');
const resultsCard = document.getElementById('resultsCard');
const aiResponse = document.getElementById('aiResponse');
const followUpInput = document.getElementById('followUpInput');
const sendBtn = document.getElementById('sendBtn');
const copyBtn = document.getElementById('copyBtn');
const saveBtn = document.getElementById('saveBtn');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');

// Tab Elements
const insightsTab = document.getElementById('insightsTab');
const notebookTab = document.getElementById('notebookTab');
const historyTab = document.getElementById('historyTab');
const insightsContent = document.getElementById('insightsContent');
const notebookContent = document.getElementById('notebookContent');
const historyContent = document.getElementById('historyContent');
const savedItemsList = document.getElementById('savedItemsList');
const noSavedItems = document.getElementById('noSavedItems');
const exportBtn = document.getElementById('exportBtn');

// State variables
let currentSelectedText = '';
let currentResponse = null;
let savedItems = [];
let historyItems = [];

// API settings
const defaultSettings = {
  provider: 'gemini',           // 'gemini' or 'perplexity'
  geminiApiKey: '',             // Google Gemini API key (must be provided by user)
  perplexityApiKey: '',         // Perplexity API key (must be provided by user)
  geminiModel: 'gemini-1.5-pro', // Gemini model selection
  perplexityModel: 'llama-3.1-sonar-small-128k-online', // Perplexity model selection
  temperature: 0.3,             // Temperature setting (0.0 to 1.0)
  maxTokens: 1024,              // Max tokens to generate
  enhancedResults: true,        // Use enhanced system prompts
  backendUrl: 'http://localhost:5000/api/query',
  debugMode: true,
  maxHistoryItems: 50,
  apiKeyDialogShown: false      // Flag to track if we've shown the API key prompt
};

// Current settings (initialized with defaults and overridden from storage)
let settings = { ...defaultSettings };

// Debug logging
function debugLog(message, data) {
  console.log(`[SonarSight] ${message}`, data || '');
}

// Load settings from storage
async function loadSettings() {
  debugLog('Loading settings from storage');

  return new Promise((resolve) => {
    chrome.storage.local.get('settings', (data) => {
      if (data.settings) {
        settings = { ...defaultSettings, ...data.settings };
        debugLog('Settings loaded from storage', settings);
      } else {
        settings = { ...defaultSettings };
        debugLog('No settings found, using defaults', settings);
      }
      resolve(settings);
    });
  });
}

// Initialize the extension
document.addEventListener('DOMContentLoaded', async () => {
  debugLog('Extension initialized');

  // Connect to the background script
  chrome.runtime.connect({ name: "popup" });
  debugLog('Connected to background script');

  // Load settings first
  await loadSettings();
  debugLog('Settings loaded', settings);

  // Check if API keys are available
  const hasGeminiKey = settings.geminiApiKey && settings.geminiApiKey.trim() !== '';
  const hasPerplexityKey = settings.perplexityApiKey && settings.perplexityApiKey.trim() !== '';

  // If no API keys are available, show the settings modal
  if (!hasGeminiKey && !hasPerplexityKey) {
    debugLog('No API keys found, showing settings modal');
    initializeSettingsUI();
    document.getElementById('settingsModal').classList.remove('hidden');
    showNotification('Please add your API key to use SonarSight', true);
  }

  // Load selected text if available
  chrome.storage.local.get(['selectedText'], (data) => {
    if (data.selectedText) {
      currentSelectedText = data.selectedText;
      displaySelectedText(data.selectedText);

      // Auto-analyze the text
      analyzeText(data.selectedText);
    } else {
      debugLog('No selected text found in storage');

      // Try to get the current selection from the active tab
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "getSelection"}, (response) => {
            if (chrome.runtime.lastError) {
              // Content script might not be loaded yet
              debugLog('Error getting selection from content script', chrome.runtime.lastError);
              return;
            }

            if (response && response.text && response.text.trim() !== '') {
              currentSelectedText = response.text;
              displaySelectedText(response.text);

              // Store the selection
              chrome.storage.local.set({
                selectedText: response.text,
                selectionSource: tabs[0].url || 'unknown source',
                selectionTimestamp: new Date().toISOString()
              });

              // Auto-analyze the text
              analyzeText(response.text);
            }
          });
        }
      });
    }
  });

  // Set up event listeners
  setupEventListeners();
});

// Clear current request when window closes
window.addEventListener('unload', () => {
  debugLog('Extension window closing, clearing current request');

  // Send a message to the background script to clear the selection
  chrome.runtime.sendMessage({ type: 'clearSelection' }, () => {
    if (chrome.runtime.lastError) {
      // Handle error silently - this is expected if the extension is being unloaded
      debugLog('Error sending clearSelection message (expected during unload)');
    } else {
      debugLog('Selection cleared via message');
    }
  });

  // Reset state variables
  currentSelectedText = '';
  currentResponse = null;
});

// Set up event listeners
function setupEventListeners() {
  // Tab switching
  insightsTab.addEventListener('click', () => setActiveTab('insights'));
  notebookTab.addEventListener('click', () => setActiveTab('notebook'));
  historyTab.addEventListener('click', () => setActiveTab('history'));

  // Follow-up input
  followUpInput.addEventListener('input', () => {
    sendBtn.disabled = followUpInput.value.trim() === '';
  });

  // Send button
  sendBtn.addEventListener('click', () => {
    const followUp = followUpInput.value.trim();
    if (followUp && currentSelectedText) {
      analyzeText(currentSelectedText, followUp);
      followUpInput.value = '';
      sendBtn.disabled = true;
    }
  });

  // Copy button
  copyBtn.addEventListener('click', copyResponseToClipboard);

  // Save button
  saveBtn.addEventListener('click', saveToNotebook);

  // Export button
  exportBtn.addEventListener('click', exportNotebook);

  // Settings button
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const resetSettingsBtn = document.getElementById('resetSettingsBtn');
  const apiProviderRadios = document.getElementsByName('apiProvider');

  // Open settings modal
  openSettingsBtn.addEventListener('click', () => {
    // Initialize settings UI
    initializeSettingsUI();
    settingsModal.classList.remove('hidden');
  });

  // Close settings modal
  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  // Save settings
  saveSettingsBtn.addEventListener('click', saveSettings);

  // Reset settings
  resetSettingsBtn.addEventListener('click', resetSettings);

  // Toggle API key containers based on selected provider
  apiProviderRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const provider = document.querySelector('input[name="apiProvider"]:checked').value;
      toggleApiKeyContainers(provider);
    });
  });
}

// Initialize the settings UI with current values
function initializeSettingsUI() {
  debugLog('Initializing settings UI');

  // Get DOM elements
  const geminiApiKey = document.getElementById('geminiApiKey');
  const perplexityApiKey = document.getElementById('perplexityApiKey');
  const backendUrl = document.getElementById('backendUrl');

  // Set API provider radio button
  const providerRadio = document.querySelector(`input[name="apiProvider"][value="${settings.provider}"]`);
  if (providerRadio) {
    providerRadio.checked = true;
    toggleApiKeyContainers(settings.provider);
  }

  // Set API keys
  geminiApiKey.value = settings.geminiApiKey || '';
  perplexityApiKey.value = settings.perplexityApiKey || '';

  // Set backend URL
  backendUrl.value = settings.backendUrl || defaultSettings.backendUrl;

  debugLog('Settings UI initialized');
}

// Toggle API key containers based on selected provider
function toggleApiKeyContainers(provider) {
  debugLog('Toggling API key containers', { provider });

  const geminiApiContainer = document.getElementById('geminiApiContainer');
  const perplexityApiContainer = document.getElementById('perplexityApiContainer');

  // Toggle API key containers
  if (provider === 'gemini') {
    geminiApiContainer.classList.remove('hidden');
    perplexityApiContainer.classList.add('hidden');
  } else if (provider === 'perplexity') {
    geminiApiContainer.classList.add('hidden');
    perplexityApiContainer.classList.remove('hidden');
  }
}

// Save settings to storage
function saveSettings() {
  debugLog('Saving settings');

  // Get DOM elements
  const geminiApiKey = document.getElementById('geminiApiKey');
  const perplexityApiKey = document.getElementById('perplexityApiKey');
  const backendUrl = document.getElementById('backendUrl');
  const settingsModal = document.getElementById('settingsModal');

  // Get values from form
  settings.provider = document.querySelector('input[name="apiProvider"]:checked').value;
  settings.geminiApiKey = geminiApiKey.value.trim();
  settings.perplexityApiKey = perplexityApiKey.value.trim();
  settings.backendUrl = backendUrl.value.trim() || defaultSettings.backendUrl;

  // Check if we have the required API key
  const requiredApiKey = settings.provider === 'gemini' ? settings.geminiApiKey : settings.perplexityApiKey;
  if (!requiredApiKey) {
    showNotification(`Please enter a valid ${settings.provider} API key`, true);
    debugLog('Missing required API key', { provider: settings.provider });
    return;
  }

  // Save to storage
  chrome.storage.local.set({ settings }, () => {
    debugLog('Settings saved to storage', settings);
    showNotification('Settings saved successfully');
    settingsModal.classList.add('hidden');
  });
}

// Reset settings to defaults
function resetSettings() {
  debugLog('Resetting settings to defaults');

  // Set back to defaults
  settings = { ...defaultSettings };

  // Update UI
  initializeSettingsUI();

  // Save to storage
  chrome.storage.local.set({ settings }, () => {
    debugLog('Settings reset to defaults', settings);
    showNotification('Settings reset to defaults');
  });
}

// Set active tab
function setActiveTab(tabName) {
  // Update tab buttons
  insightsTab.classList.toggle('active', tabName === 'insights');
  notebookTab.classList.toggle('active', tabName === 'notebook');
  historyTab.classList.toggle('active', tabName === 'history');

  // Update tab content
  insightsContent.classList.toggle('hidden', tabName !== 'insights');
  notebookContent.classList.toggle('hidden', tabName !== 'notebook');
  historyContent.classList.toggle('hidden', tabName !== 'history');

  // Load content for the selected tab
  if (tabName === 'notebook') {
    loadSavedItems();
  } else if (tabName === 'history') {
    loadHistoryItems();
  }

  debugLog(`Switched to ${tabName} tab`);
}

// Display selected text
function displaySelectedText(text) {
  if (!text || text.trim() === '') {
    selectedTextElement.innerHTML = '<p class="empty-text">No text selected. Highlight text on any webpage and use the context menu to analyze it.</p>';
    return;
  }

  // Truncate text if it's too long
  const displayText = text.length > 300 ? text.substring(0, 300) + '...' : text;
  selectedTextElement.innerHTML = `<p>${displayText}</p>`;
}

// Mock analyze text function (simulates server response)
function mockAnalyzeText(text, query = "Analyze and summarize this text") {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Create a simple analysis based on the text length
      const wordCount = text.split(/\s+/).length;
      const sentenceCount = text.split(/[.!?]+/).length - 1;

      // Generate a simple analysis
      const analysis = `
# Analysis of Selected Text

The selected text contains approximately ${wordCount} words and ${sentenceCount} sentences.

## Summary
${query === "Analyze and summarize this text" ?
  "This text appears to be discussing " + (text.length > 50 ? text.substring(0, 50) + "..." : text) :
  "Responding to your question: " + query}

## Key Points
* The text is ${wordCount < 50 ? "relatively short" : wordCount < 200 ? "medium length" : "quite lengthy"}.
* ${sentenceCount < 3 ? "It contains very few sentences." : sentenceCount < 10 ? "It has a moderate number of sentences." : "It contains many sentences."}
* ${text.includes("?") ? "The text contains questions, suggesting it's inquiring about something." : "The text is primarily statements rather than questions."}

## Recommendations
* ${wordCount < 30 ? "Consider providing more context for a more detailed analysis." : "The text provides sufficient context for analysis."}
* For more specific insights, try asking follow-up questions about particular aspects of the text.
      `;

      resolve({
        content: analysis,
        citations: ["https://example.com/citation1", "https://example.com/citation2"],
        provider: "mock-provider"
      });
    }, 1500); // 1.5 second delay to simulate network request
  });
}

// Make API request to the backend
async function makeApiRequest(text, query) {
  debugLog('Making API request', { text: text.substring(0, 50) + '...', query });

  // Check if we have API keys
  const hasGeminiKey = settings.geminiApiKey && settings.geminiApiKey.trim() !== '';
  const hasPerplexityKey = settings.perplexityApiKey && settings.perplexityApiKey.trim() !== '';

  if (!hasGeminiKey && !hasPerplexityKey) {
    throw new Error('No API keys available. Please add your API key in the settings.');
  }

  // Determine which provider to use
  const provider = settings.provider;
  const apiKey = provider === 'gemini' ? settings.geminiApiKey : settings.perplexityApiKey;

  if (!apiKey) {
    throw new Error(`No API key available for ${provider}. Please add your API key in the settings.`);
  }

  // Prepare the payload
  const payload = {
    query: query,
    context: text,
    provider: provider,
    apiKey: apiKey,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    model: provider === 'gemini' ? settings.geminiModel : settings.perplexityModel,
    enhancedResults: settings.enhancedResults
  };

  try {
    // Make the API request
    const response = await fetch(settings.backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    debugLog('API request failed', { error: error.message });
    throw error;
  }
}

// Analyze text
function analyzeText(text, followUp = null) {
  if (!text || text.trim() === '') {
    debugLog('Error: Empty text provided for analysis');
    return;
  }

  // Show loading state
  loadingState.style.display = 'block';
  resultsCard.style.display = 'none';

  // Determine the query
  const query = followUp || "Analyze and summarize this text";

  // Try to use the real API first, fall back to mock if it fails
  makeApiRequest(text, query)
    .then(data => {
      // Hide loading state
      loadingState.style.display = 'none';
      resultsCard.style.display = 'block';

      // Store the response
      currentResponse = data;

      // Display the response with simple markdown-like formatting
      const formattedContent = formatMarkdown(data.content);
      aiResponse.innerHTML = formattedContent;

      // Enable the follow-up input
      followUpInput.disabled = false;

      // Add to history
      addToHistory({
        id: Date.now().toString(),
        query: followUp || 'Analysis of selected text',
        content: data.content,
        timestamp: new Date().toLocaleTimeString(),
        source: 'Current page',
        context: text
      });
    })
    .catch(error => {
      debugLog('API request failed, falling back to mock', { error: error.message });

      // Fall back to mock if the API request fails
      mockAnalyzeText(text, query)
        .then(data => {
          // Hide loading state
          loadingState.style.display = 'none';
          resultsCard.style.display = 'block';

          // Store the response
          currentResponse = data;

          // Display the response with simple markdown-like formatting
          const formattedContent = formatMarkdown(data.content);
          aiResponse.innerHTML = formattedContent;

          // Enable the follow-up input
          followUpInput.disabled = false;

          // Add to history
          addToHistory({
            id: Date.now().toString(),
            query: followUp || 'Analysis of selected text',
            content: data.content,
            timestamp: new Date().toLocaleTimeString(),
            source: 'Current page (mock)',
            context: text
          });

          // Show a notification that we're using mock data
          showNotification('Using offline mode (mock data)', true);
        })
        .catch(mockError => {
          debugLog('Mock API also failed', { error: mockError.message });
          loadingState.style.display = 'none';

          // Show error message
          resultsCard.style.display = 'block';
          aiResponse.innerHTML = `<p><strong>Error:</strong> Could not get response from the AI service.</p><p>Details: ${error.message}</p><p>Mock error: ${mockError.message}</p>`;

          showNotification('Error: Failed to get response', true);
        });
    });
}

// Simple markdown formatter
function formatMarkdown(text) {
  // Replace headers
  text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');

  // Replace lists
  text = text.replace(/^\* (.+)$/gm, '<li>$1</li>');
  text = text.replace(/^- (.+)$/gm, '<li>$1</li>');

  // Wrap lists in ul tags
  text = text.replace(/(<li>.+<\/li>)\n(?!<li>)/g, '$1</ul>\n');
  text = text.replace(/(?<!<\/ul>\n)(<li>)/g, '<ul>$1');

  // Replace paragraphs
  text = text.replace(/^([^<\n].+)$/gm, '<p>$1</p>');

  // Replace double line breaks with single line breaks
  text = text.replace(/\n\n/g, '\n');

  return text;
}

// Copy response to clipboard
function copyResponseToClipboard() {
  if (!currentResponse) {
    debugLog('No response to copy');
    return;
  }

  // Create a temporary textarea element
  const textarea = document.createElement('textarea');
  textarea.value = currentResponse.content;
  textarea.style.position = 'fixed';  // Prevent scrolling to bottom
  document.body.appendChild(textarea);
  textarea.select();

  try {
    // Execute copy command
    const successful = document.execCommand('copy');
    if (successful) {
      debugLog('Content copied to clipboard successfully');
      showNotification('Copied to clipboard');
    } else {
      throw new Error('Copy command failed');
    }
  } catch (err) {
    debugLog('Error copying to clipboard', err.message);
    showNotification('Failed to copy', true);
  } finally {
    // Clean up
    document.body.removeChild(textarea);
  }
}

// Save to notebook
function saveToNotebook() {
  if (!currentResponse) {
    debugLog('No current response to save');
    return;
  }

  const newItem = {
    id: Date.now().toString(),
    title: currentSelectedText.substring(0, 30) + (currentSelectedText.length > 30 ? '...' : ''),
    content: currentResponse.content,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString()
  };

  // Load existing saved items
  chrome.storage.local.get(['savedItems'], (data) => {
    let items = [];
    if (data.savedItems) {
      try {
        items = JSON.parse(data.savedItems);
      } catch (e) {
        debugLog('Error parsing saved items', e.message);
        items = [];
      }
    }

    // Add new item
    items.unshift(newItem);

    // Save back to storage
    chrome.storage.local.set({ savedItems: JSON.stringify(items) }, () => {
      showNotification('Saved to notebook');
      // Update the savedItems array
      savedItems = items;
      // Update the notebook view if it's visible
      if (!notebookContent.classList.contains('hidden')) {
        updateNotebookView();
      }
    });
  });
}

// Load saved items
function loadSavedItems() {
  debugLog('Loading saved items from storage');

  chrome.storage.local.get(['savedItems'], (data) => {
    if (data.savedItems) {
      try {
        savedItems = JSON.parse(data.savedItems);
        debugLog('Saved items loaded successfully', { count: savedItems.length });
        updateNotebookView();
      } catch (error) {
        debugLog('Error parsing saved items', { error: error.message });
        savedItems = [];
        updateNotebookView();
      }
    } else {
      debugLog('No saved items found in storage');
      savedItems = [];
      updateNotebookView();
    }
  });
}

// Update notebook view
function updateNotebookView() {
  debugLog('Updating notebook view', { savedItemsCount: savedItems.length });

  if (savedItems.length === 0) {
    noSavedItems.style.display = 'block';
    savedItemsList.innerHTML = '';
    debugLog('No saved items, showing empty state');
    return;
  }

  noSavedItems.style.display = 'none';
  let html = '';

  savedItems.forEach(item => {
    html += `
      <div class="saved-item" data-id="${item.id}">
        <div class="saved-item-header">
          <h3 class="saved-item-title">${item.title}</h3>
        </div>
        <p class="saved-item-date">Saved on ${item.date || 'Unknown date'}</p>
        <div class="saved-item-preview">${formatMarkdown(item.content.substring(0, 150))}...</div>
        <div class="saved-item-actions">
          <button class="view-full-btn" data-id="${item.id}">View Full</button>
          <button class="delete-btn" data-id="${item.id}">Delete</button>
        </div>
      </div>
    `;
  });

  savedItemsList.innerHTML = html;
  debugLog('Notebook items rendered', { count: savedItems.length });

  // Add event listeners for buttons
  document.querySelectorAll('.view-full-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      viewSavedItem(id);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      deleteSavedItem(id);
    });
  });
}

// View saved item
function viewSavedItem(id) {
  debugLog('Viewing saved item', { id });

  const item = savedItems.find(item => item.id === id);
  if (!item) {
    debugLog('Item not found', { id });
    return;
  }

  // Switch to insights tab
  setActiveTab('insights');

  // Display the item content
  resultsCard.style.display = 'block';
  aiResponse.innerHTML = formatMarkdown(item.content);

  // Set current response
  currentResponse = {
    content: item.content,
    citations: []
  };

  showNotification('Viewing saved item');
}

// Delete saved item
function deleteSavedItem(id) {
  debugLog('Deleting saved item', { id });

  const index = savedItems.findIndex(item => item.id === id);
  if (index === -1) {
    debugLog('Item not found', { id });
    return;
  }

  // Remove the item
  savedItems.splice(index, 1);

  // Save to storage
  chrome.storage.local.set({ savedItems: JSON.stringify(savedItems) }, () => {
    updateNotebookView();
    showNotification('Item deleted');
  });
}

// Export notebook
function exportNotebook() {
  debugLog('Exporting notebook', { itemCount: savedItems.length });

  if (savedItems.length === 0) {
    showNotification('No items to export', true);
    return;
  }

  // Create markdown content
  const content = savedItems.map(item => (
    `# ${item.title}\n` +
    `Date: ${item.date || 'Unknown date'}\n\n` +
    `${item.content}\n\n` +
    `---\n\n`
  )).join('');

  // Copy to clipboard
  const textarea = document.createElement('textarea');
  textarea.value = content;
  textarea.style.position = 'fixed';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
    showNotification('Notebook exported to clipboard');
  } catch (error) {
    debugLog('Error exporting notebook', { error: error.message });
    showNotification('Error exporting notebook', true);
  } finally {
    document.body.removeChild(textarea);
  }
}

// Add to history
function addToHistory(item) {
  debugLog('Adding item to history', { id: item.id, query: item.query });

  // Add to the beginning of the array
  historyItems.unshift(item);

  // Limit to 50 items
  if (historyItems.length > 50) {
    historyItems = historyItems.slice(0, 50);
  }

  // Save to storage
  chrome.storage.local.set({ historyItems: JSON.stringify(historyItems) }, () => {
    debugLog('History saved to storage');
    // Update the history view if it's visible
    if (!historyContent.classList.contains('hidden')) {
      updateHistoryView();
    }
  });
}

// Load history items
function loadHistoryItems() {
  debugLog('Loading history items from storage');

  chrome.storage.local.get(['historyItems'], (data) => {
    if (data.historyItems) {
      try {
        historyItems = JSON.parse(data.historyItems);
        debugLog('History items loaded successfully', { count: historyItems.length });
        updateHistoryView();
      } catch (error) {
        debugLog('Error parsing history items', { error: error.message });
        historyItems = [];
        updateHistoryView();
      }
    } else {
      debugLog('No history items found in storage');
      historyItems = [];
      updateHistoryView();
    }
  });
}

// Update history view
function updateHistoryView() {
  debugLog('Updating history view', { historyItemsCount: historyItems.length });

  const noHistoryItems = document.getElementById('noHistoryItems');
  const historyTimeline = document.getElementById('historyTimeline');

  if (historyItems.length === 0) {
    noHistoryItems.style.display = 'block';
    historyTimeline.innerHTML = '';
    debugLog('No history items, showing empty state');
    return;
  }

  noHistoryItems.style.display = 'none';
  let html = '';

  historyItems.forEach(item => {
    html += `
      <div class="history-item" data-id="${item.id}">
        <p class="history-timestamp">${item.timestamp}</p>
        <p class="history-query">${item.query}</p>
        <p class="history-source">From: ${item.source}</p>
        <button class="view-history-btn" data-id="${item.id}">View Results</button>
      </div>
    `;
  });

  historyTimeline.innerHTML = html;
  debugLog('History items rendered', { count: historyItems.length });

  // Add event listeners for view buttons
  document.querySelectorAll('.view-history-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      viewHistoryItem(id);
    });
  });
}

// View history item
function viewHistoryItem(id) {
  debugLog('Viewing history item', { id });

  const item = historyItems.find(item => item.id === id);
  if (!item) {
    debugLog('Item not found', { id });
    return;
  }

  // Switch to insights tab
  setActiveTab('insights');

  // Set the selected text if available
  if (item.context) {
    currentSelectedText = item.context;
    displaySelectedText(item.context);
  }

  // Display the item content
  resultsCard.style.display = 'block';
  aiResponse.innerHTML = formatMarkdown(item.content);

  // Set current response
  currentResponse = {
    content: item.content,
    citations: []
  };

  showNotification('Viewing history item');
}

// Show notification
function showNotification(message, isError = false) {
  notificationText.textContent = message;

  if (isError) {
    notification.classList.add('error');
  } else {
    notification.classList.remove('error');
  }

  notification.style.display = 'block';

  // Hide after 3 seconds
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}
