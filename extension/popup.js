// DOM Elements
const insightsTab = document.getElementById('insightsTab');
const notebookTab = document.getElementById('notebookTab');
const historyTab = document.getElementById('historyTab');

const insightsContent = document.getElementById('insightsContent');
const notebookContent = document.getElementById('notebookContent');
const historyContent = document.getElementById('historyContent');

const selectedTextElement = document.getElementById('selectedText');
const loadingState = document.getElementById('loadingState');
const resultsCard = document.getElementById('resultsCard');
const aiResponse = document.getElementById('aiResponse');
const citationsSection = document.getElementById('citationsSection');
const citationsLabel = document.getElementById('citationsLabel');
const citationsList = document.getElementById('citationsList');
const toggleCitations = document.getElementById('toggleCitations');

const followUpInput = document.getElementById('followUpInput');
const sendBtn = document.getElementById('sendBtn');
const copyBtn = document.getElementById('copyBtn');
const saveBtn = document.getElementById('saveBtn');
const exportBtn = document.getElementById('exportBtn');

const noSavedItems = document.getElementById('noSavedItems');
const savedItemsList = document.getElementById('savedItemsList');
const noHistoryItems = document.getElementById('noHistoryItems');
const historyTimeline = document.getElementById('historyTimeline');
const loadMoreHistory = document.getElementById('loadMoreHistory');

const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');

// Settings modal elements
const settingsBtn = document.getElementById('settingsBtn');
const helpBtn = document.getElementById('helpBtn');
const settingsModal = document.getElementById('settingsModal');
const helpModal = document.getElementById('helpModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const closeHelpBtn = document.getElementById('closeHelpBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');
const apiProviderRadios = document.querySelectorAll('input[name="apiProvider"]');
const geminiApiKey = document.getElementById('geminiApiKey');
const perplexityApiKey = document.getElementById('perplexityApiKey');
const geminiApiContainer = document.getElementById('geminiApiContainer');
const perplexityApiContainer = document.getElementById('perplexityApiContainer');
const debugModeToggle = document.getElementById('debugModeToggle');
const backendUrl = document.getElementById('backendUrl');
const maxHistoryItems = document.getElementById('maxHistoryItems');
const keyVisibilityToggles = document.querySelectorAll('.toggle-visibility-btn');

// State
let currentSelectedText = '';
let currentResponse = null;
let savedItems = [];
let historyItems = [];
let isCitationsOpen = false;

// Default settings
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

// Debug logging function
function debugLog(message, data = null) {
  if (!settings.debugMode) return;

  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[SonarSight ${timestamp}]`, message, data);
  } else {
    console.log(`[SonarSight ${timestamp}]`, message);
  }
}

// Dynamic suggestion chip categories and their associated questions
const suggestionCategories = {
  general: [
    "Summarize the key points",
    "What are the main arguments?",
    "Identify the most important concepts",
    "What's the central thesis?",
    "Analyze the author's perspective",
    "Explain the significance",
    "How is this structured?",
    "Highlight the main themes"
  ],
  academic: [
    "Explain this in academic terms",
    "What research supports this?",
    "What are the methodological issues?",
    "Compare different theoretical approaches",
    "Identify research gaps",
    "Discuss related academic theories",
    "Evaluate the research design",
    "What further studies are needed?"
  ],
  business: [
    "What are the business implications?",
    "How does this affect market trends?",
    "What's the ROI potential?",
    "Identify competitive advantages",
    "What strategic opportunities exist?",
    "SWOT analysis of this approach",
    "How would this scale in enterprise?",
    "Impact on business operations?"
  ],
  technology: [
    "Explain the technical aspects",
    "What technologies are involved?",
    "Compare with alternative technologies",
    "Future technological developments?",
    "Technical limitations to consider?",
    "How could this be implemented?",
    "Security implications to consider",
    "Integration challenges with existing systems"
  ],
  critique: [
    "What are potential criticisms?",
    "Identify logical fallacies",
    "What counterarguments exist?",
    "Ethical concerns to consider?",
    "What evidence is missing?",
    "Are there alternative perspectives?",
    "What assumptions underlie this?",
    "How could this reasoning be strengthened?"
  ],
  practical: [
    "How can this be applied practically?",
    "What are the real-world applications?",
    "Steps to implement this",
    "Challenges in practical application",
    "Resources needed to execute this",
    "Timeline for implementation",
    "How to measure success?",
    "Best practices for implementation"
  ],
  creative: [
    "Creative ways to approach this",
    "Innovative applications of these concepts",
    "How might this evolve in the future?",
    "Unexpected implications",
    "Cross-disciplinary connections",
    "Reimagine this from a different perspective",
    "Speculative outcomes",
    "Design thinking approach to this"
  ]
};

// Initialize the extension
document.addEventListener('DOMContentLoaded', () => {
  debugLog('Extension initialized');

  // Load settings first
  loadSettings().then(() => {
    debugLog('Settings loaded', settings);

    // Load saved data
    loadSavedItems();
    loadHistoryItems();

    // Initialize settings UI with the loaded values
    initializeSettingsUI();

    // Load selected text if available
    chrome.storage.local.get(['selectedText', 'selectionSource'], (data) => {
      debugLog('Retrieved stored text from Chrome storage', {
        hasText: !!data.selectedText,
        textLength: data.selectedText ? data.selectedText.length : 0,
        source: data.selectionSource
      });

      if (data.selectedText) {
        currentSelectedText = data.selectedText;
        displaySelectedText(data.selectedText);

        // Generate initial suggestion chips even before analysis is complete
        generateSuggestionChips(data.selectedText);

        // Clear the badge
        chrome.action.setBadgeText({ text: '' });
        debugLog('Badge text cleared');

        // Auto-analyze the text
        analyzeText(data.selectedText);
      } else {
        debugLog('No selected text found in storage');
      }
    });

    // Set up event listeners
    setupEventListeners();
    debugLog('Event listeners set up');
  });
});

// Clear current request when window closes
window.addEventListener('unload', () => {
  debugLog('Extension window closing, clearing current request');

  // Clear the selected text from storage
  chrome.storage.local.remove(['selectedText', 'selectionSource'], () => {
    debugLog('Selected text cleared from storage');
  });

  // Reset state variables
  currentSelectedText = '';
  currentResponse = null;
});

// Setup event listeners
function setupEventListeners() {
  debugLog('Setting up event listeners');

  // Tab switching
  insightsTab.addEventListener('click', () => setActiveTab('insights'));
  notebookTab.addEventListener('click', () => setActiveTab('notebook'));
  historyTab.addEventListener('click', () => setActiveTab('history'));
  debugLog('Tab navigation listeners added');

  // Send button
  sendBtn.addEventListener('click', handleSendQuery);
  followUpInput.addEventListener('input', () => {
    sendBtn.disabled = followUpInput.value.trim() === '';
  });
  followUpInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && followUpInput.value.trim() !== '') {
      handleSendQuery();
    }
  });
  debugLog('Query input listeners added');

  // Suggestion chips - handled by the generateSuggestionChips function now
  // We use a delegation pattern for dynamically added chips
  document.querySelector('.suggestion-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.suggestion-chip');
    if (chip) {
      followUpInput.value = chip.dataset.query;
      sendBtn.disabled = false;
      debugLog('Suggestion chip clicked', { query: chip.dataset.query });
    }
  });
  debugLog('Suggestion chips delegation listener added');

  // Citations toggle
  toggleCitations.addEventListener('click', toggleCitationsView);

  // Action buttons
  copyBtn.addEventListener('click', copyResponseToClipboard);
  saveBtn.addEventListener('click', saveToNotebook);
  exportBtn.addEventListener('click', exportNotebook);
  debugLog('Action button listeners added');

  // Load more history button
  if (loadMoreHistory) {
    loadMoreHistory.addEventListener('click', () => {
      debugLog('Load more history button clicked');
      // Implementation for loading more history
    });
  }

  // Settings Modal
  settingsBtn.addEventListener('click', () => {
    debugLog('Settings button clicked');
    settingsModal.classList.remove('hidden');
  });

  closeSettingsBtn.addEventListener('click', () => {
    debugLog('Close settings button clicked');
    settingsModal.classList.add('hidden');
  });

  saveSettingsBtn.addEventListener('click', saveSettings);
  resetSettingsBtn.addEventListener('click', resetSettings);

  // Help Modal
  helpBtn.addEventListener('click', () => {
    debugLog('Help button clicked');
    helpModal.classList.remove('hidden');
  });

  closeHelpBtn.addEventListener('click', () => {
    debugLog('Close help button clicked');
    helpModal.classList.add('hidden');
  });

  // API Provider Selection
  apiProviderRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const provider = e.target.value;
      debugLog('API provider changed', { provider });
      toggleApiKeyContainers(provider);
    });
  });

  // API Key Visibility Toggles
  keyVisibilityToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      const inputId = e.currentTarget.dataset.for;
      const input = document.getElementById(inputId);

      if (input.type === 'password') {
        input.type = 'text';
        e.currentTarget.innerHTML = '<i class="fas fa-eye-slash"></i>';
      } else {
        input.type = 'password';
        e.currentTarget.innerHTML = '<i class="fas fa-eye"></i>';
      }

      debugLog('Password visibility toggled', { inputId });
    });
  });

  debugLog('Settings event listeners added');
}

// Set active tab
function setActiveTab(tabName) {
  debugLog('Changing active tab', { tabName });

  // Reset all tabs
  [insightsTab, notebookTab, historyTab].forEach(tab => {
    tab.classList.remove('active');
  });

  // Reset all content
  [insightsContent, notebookContent, historyContent].forEach(content => {
    content.classList.add('hidden');
  });

  // Set active tab
  if (tabName === 'insights') {
    insightsTab.classList.add('active');
    insightsContent.classList.remove('hidden');
    debugLog('Insights tab activated');
  } else if (tabName === 'notebook') {
    notebookTab.classList.add('active');
    notebookContent.classList.remove('hidden');
    updateNotebookView();
    debugLog('Notebook tab activated');
  } else if (tabName === 'history') {
    historyTab.classList.add('active');
    historyContent.classList.remove('hidden');
    updateHistoryView();
    debugLog('History tab activated');
  }
}

// Display selected text
function displaySelectedText(text) {
  debugLog('Displaying selected text', {
    length: text ? text.length : 0,
    isEmpty: !text || text.trim() === ''
  });

  if (!text || text.trim() === '') {
    selectedTextElement.innerHTML = `<p class="empty-text">No text selected. Highlight text on any webpage and use the context menu to analyze it.</p>`;
    debugLog('Empty text state displayed');
  } else {
    selectedTextElement.innerHTML = `<p>${text}</p>`;
    debugLog('Selected text displayed');
  }
}

// Handle send query
function handleSendQuery() {
  const query = followUpInput.value.trim();
  debugLog('Handling send query', { query });

  if (!query) {
    debugLog('Empty query, not sending');
    return;
  }

  analyzeText(currentSelectedText, query);
  followUpInput.value = '';
  sendBtn.disabled = true;
  debugLog('Query sent, input cleared');
}

// Toggle citations view
function toggleCitationsView() {
  isCitationsOpen = !isCitationsOpen;
  debugLog('Toggling citations view', { open: isCitationsOpen });

  if (isCitationsOpen) {
    citationsList.classList.add('open');
    citationsLabel.textContent = 'Hide citations';
    toggleCitations.querySelector('i').classList.replace('fa-chevron-down', 'fa-chevron-up');
    debugLog('Citations expanded');
  } else {
    citationsList.classList.remove('open');
    citationsLabel.textContent = `Show ${currentResponse?.citations?.length || 0} citations`;
    toggleCitations.querySelector('i').classList.replace('fa-chevron-up', 'fa-chevron-down');
    debugLog('Citations collapsed');
  }
}

// Copy response to clipboard
function copyResponseToClipboard() {
  if (!currentResponse) {
    debugLog('No response to copy');
    return;
  }

  debugLog('Attempting to copy response to clipboard', { contentLength: currentResponse.content.length });

  navigator.clipboard.writeText(currentResponse.content)
    .then(() => {
      debugLog('Content copied to clipboard successfully');
      showNotification('Copied to clipboard');
    })
    .catch(err => {
      debugLog('Error copying to clipboard', { error: err.message });
      console.error('Failed to copy text: ', err);
      showNotification('Failed to copy', 'error');
    });
}

// Generate dynamic suggestion chips based on content
function generateSuggestionChips(text, response = null) {
  debugLog('Generating suggestion chips');

  // Content categories with their keywords for detection
  const categoryKeywords = {
    academic: ['research', 'study', 'academic', 'theory', 'methodology', 'hypothesis', 'experiment', 'literature', 'journal', 'publication', 'findings', 'professor', 'university', 'scholar'],
    business: ['market', 'business', 'company', 'strategy', 'profit', 'revenue', 'sales', 'customer', 'client', 'stakeholder', 'roi', 'investment', 'commercial', 'entrepreneur'],
    technology: ['technology', 'software', 'digital', 'code', 'programming', 'algorithm', 'hardware', 'computer', 'app', 'application', 'device', 'system', 'interface', 'data'],
    practical: ['implement', 'apply', 'practice', 'steps', 'guide', 'method', 'procedure', 'approach', 'technique', 'process', 'protocol', 'resource', 'toolkit', 'framework'],
    creative: ['creative', 'innovative', 'imagine', 'design', 'novel', 'artistic', 'unique', 'inspiration', 'perspective', 'vision', 'reimagine', 'conceptual', 'speculative']
  };

  // Identify the most likely content categories
  let categoryScores = {
    general: 1, // Default has a base score
    academic: 0,
    business: 0,
    technology: 0,
    practical: 0,
    creative: 0,
    critique: 0 // Critique is always included as a secondary category
  };

  // Perform more sophisticated content analysis
  const lowerText = text.toLowerCase();
  debugLog('Analyzing text content', lowerText.substring(0, 100) + '...');

  // Calculate scores for each category
  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        categoryScores[category] += 1;
      }
    });
  });

  // If response is available, analyze it as well
  if (response) {
    const lowerResponse = response.toLowerCase();
    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerResponse.includes(keyword)) {
          categoryScores[category] += 0.5; // Response keywords are weighted less than original content
        }
      });
    });
  }

  // Get the top 2 categories (excluding critique which is always included)
  const critiqueCategoryScore = categoryScores.critique;
  delete categoryScores.critique;

  const sortedCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  const primaryCategory = sortedCategories[0];
  const secondaryCategory = sortedCategories[1];

  debugLog('Content category analysis results', {
    scores: categoryScores,
    primaryCategory,
    secondaryCategory
  });

  // Get suggestions from the top 2 categories and add critique
  const primarySuggestions = [...suggestionCategories[primaryCategory]];
  const secondarySuggestions = [...suggestionCategories[secondaryCategory]];
  const critiqueSuggestions = [...suggestionCategories.critique];

  // Shuffle arrays to get random suggestions
  shuffleArray(primarySuggestions);
  shuffleArray(secondarySuggestions);
  shuffleArray(critiqueSuggestions);

  // Select the suggestions (2 primary, 1 secondary, 1 critique)
  const selectedSuggestions = [
    primarySuggestions[0],
    primarySuggestions[1],
    secondarySuggestions[0],
    critiqueSuggestions[0]
  ];

  debugLog('Selected suggestions', selectedSuggestions);

  // Generate the HTML
  const suggestionChipsContainer = document.querySelector('.suggestion-chips');
  if (!suggestionChipsContainer) {
    debugLog('Error: Suggestion chips container not found');
    return;
  }

  let chipsHTML = '';
  selectedSuggestions.forEach(suggestion => {
    chipsHTML += `
      <button class="suggestion-chip" data-query="${suggestion}">
        ${suggestion}
      </button>
    `;
  });

  suggestionChipsContainer.innerHTML = chipsHTML;
  debugLog('Suggestion chips updated');

  // Event listeners for chips are handled via delegation in setupEventListeners
}

// Utility function to shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Settings Management Functions
// Initialize the settings UI with current values
function initializeSettingsUI() {
  debugLog('Initializing settings UI');

  // Set API provider radio button
  const providerRadio = document.querySelector(`input[name="apiProvider"][value="${settings.provider}"]`);
  if (providerRadio) {
    providerRadio.checked = true;
    toggleApiKeyContainers(settings.provider);
  }

  // Set API keys
  geminiApiKey.value = settings.geminiApiKey || '';
  perplexityApiKey.value = settings.perplexityApiKey || '';

  // Set model selections
  const geminiModelOption = document.querySelector(`#geminiModel option[value="${settings.geminiModel}"]`);
  if (geminiModelOption) {
    geminiModelOption.selected = true;
  }

  const perplexityModelOption = document.querySelector(`#perplexityModel option[value="${settings.perplexityModel}"]`);
  if (perplexityModelOption) {
    perplexityModelOption.selected = true;
  }

  // Set temperature slider
  const temperatureSlider = document.getElementById('temperatureSlider');
  const temperatureValue = document.getElementById('temperatureValue');
  if (temperatureSlider && temperatureValue) {
    temperatureSlider.value = settings.temperature;
    temperatureValue.textContent = settings.temperature;

    // Add event listener for temperature slider
    temperatureSlider.addEventListener('input', (e) => {
      temperatureValue.textContent = e.target.value;
    });
  }

  // Set max tokens
  const maxTokensOption = document.querySelector(`#maxTokens option[value="${settings.maxTokens}"]`);
  if (maxTokensOption) {
    maxTokensOption.selected = true;
  }

  // Set enhanced results toggle
  const enhancedResultsToggle = document.getElementById('enhancedResultsToggle');
  if (enhancedResultsToggle) {
    enhancedResultsToggle.checked = settings.enhancedResults;
  }

  // Set backend URL
  backendUrl.value = settings.backendUrl || defaultSettings.backendUrl;

  // Set debug mode toggle
  debugModeToggle.checked = settings.debugMode;

  // Set max history items
  const historyOption = document.querySelector(`#maxHistoryItems option[value="${settings.maxHistoryItems}"]`);
  if (historyOption) {
    historyOption.selected = true;
  }

  debugLog('Settings UI initialized');
}

// Toggle API key containers based on selected provider
function toggleApiKeyContainers(provider) {
  debugLog('Toggling API key containers', { provider });

  // Toggle API key containers
  if (provider === 'gemini') {
    geminiApiContainer.classList.remove('hidden');
    perplexityApiContainer.classList.add('hidden');
  } else if (provider === 'perplexity') {
    geminiApiContainer.classList.add('hidden');
    perplexityApiContainer.classList.remove('hidden');
  }

  // Toggle model selection containers
  const geminiModelContainer = document.getElementById('geminiModelContainer');
  const perplexityModelContainer = document.getElementById('perplexityModelContainer');

  if (geminiModelContainer && perplexityModelContainer) {
    if (provider === 'gemini') {
      geminiModelContainer.classList.remove('hidden');
      perplexityModelContainer.classList.add('hidden');
    } else if (provider === 'perplexity') {
      geminiModelContainer.classList.add('hidden');
      perplexityModelContainer.classList.remove('hidden');
    }
  }
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

// Save settings to storage
function saveSettings() {
  debugLog('Saving settings');

  // Get values from form
  settings.provider = document.querySelector('input[name="apiProvider"]:checked').value;
  settings.geminiApiKey = geminiApiKey.value.trim();
  settings.perplexityApiKey = perplexityApiKey.value.trim();

  // Get model selections
  const geminiModelSelect = document.getElementById('geminiModel');
  if (geminiModelSelect) {
    settings.geminiModel = geminiModelSelect.value;
  }

  const perplexityModelSelect = document.getElementById('perplexityModel');
  if (perplexityModelSelect) {
    settings.perplexityModel = perplexityModelSelect.value;
  }

  // Get temperature setting
  const temperatureSlider = document.getElementById('temperatureSlider');
  if (temperatureSlider) {
    settings.temperature = parseFloat(temperatureSlider.value);
  }

  // Get max tokens
  const maxTokensSelect = document.getElementById('maxTokens');
  if (maxTokensSelect) {
    settings.maxTokens = parseInt(maxTokensSelect.value, 10);
  }

  // Get enhanced results toggle
  const enhancedResultsToggle = document.getElementById('enhancedResultsToggle');
  if (enhancedResultsToggle) {
    settings.enhancedResults = enhancedResultsToggle.checked;
  }

  // Get other settings
  settings.backendUrl = backendUrl.value.trim() || defaultSettings.backendUrl;
  settings.debugMode = debugModeToggle.checked;
  settings.maxHistoryItems = parseInt(maxHistoryItems.value, 10);

  // Check if we have the required API key
  const requiredApiKey = settings.provider === 'gemini' ? settings.geminiApiKey : settings.perplexityApiKey;
  if (!requiredApiKey) {
    showNotification(`Please enter a valid ${settings.provider} API key`, 'error');
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

// Analyze text
function analyzeText(text, followUp = null) {
  debugLog('Starting text analysis', {
    textLength: text ? text.length : 0,
    followUp: followUp
  });

  if (!text || text.trim() === '') {
    debugLog('Error: Empty text provided for analysis');
    return;
  }

  // Check if user has provided any API keys at all
  const hasGeminiKey = settings.geminiApiKey && settings.geminiApiKey.trim() !== '';
  const hasPerplexityKey = settings.perplexityApiKey && settings.perplexityApiKey.trim() !== '';

  // If no API keys are available at all, show the settings modal with a prompt
  if (!hasGeminiKey && !hasPerplexityKey) {
    // Show the settings modal if we haven't shown it yet
    if (!settings.apiKeyDialogShown) {
      settingsModal.classList.remove('hidden');

      // Display a clear message for the user
      showNotification('Please add your API key to use SonarSight', 'warning', 8000);

      // Update the flag so we don't keep showing this
      settings.apiKeyDialogShown = true;
      chrome.storage.local.set({ settings });

      debugLog('No API keys found, showing settings modal');
      return;
    } else {
      showNotification('SonarSight requires an API key to function. Please add it in settings.', 'error');
      debugLog('No API keys available and dialog already shown');
      return;
    }
  }

  // If the selected provider doesn't have a key but the other one does, switch providers
  const currentProvider = settings.provider;
  const apiKey = currentProvider === 'gemini' ? settings.geminiApiKey : settings.perplexityApiKey;

  if (!apiKey) {
    // Switch to the provider that has a key
    settings.provider = currentProvider === 'gemini' ? 'perplexity' : 'gemini';
    debugLog(`Switching provider from ${currentProvider} to ${settings.provider} due to missing API key`);

    // Save the setting change
    chrome.storage.local.set({ settings });

    // Show notification about the provider switch
    showNotification(`Switched to ${settings.provider} API since no ${currentProvider} key was found`, 'info');

    // Check if the new provider has a key
    const newApiKey = settings.provider === 'gemini' ? settings.geminiApiKey : settings.perplexityApiKey;
    if (!newApiKey) {
      showNotification(`Please set your ${settings.provider} API key in settings`, 'error');
      debugLog('No valid API keys available for any provider');
      return;
    }
  }

  // Show loading state
  loadingState.classList.remove('hidden');
  resultsCard.classList.add('hidden');
  debugLog('Loading state displayed');

  // Determine the model to use based on the provider
  const model = settings.provider === 'gemini' ? settings.geminiModel : settings.perplexityModel;

  const payload = {
    query: followUp || 'Analyze and summarize this text with citations',
    context: text,
    provider: settings.provider,
    apiKey: apiKey,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    model: model,
    enhancedResults: settings.enhancedResults
  };

  debugLog('Sending API request', {
    endpoint: settings.backendUrl,
    provider: settings.provider,
    query: payload.query,
    contextLength: payload.context.length
  });

  fetch(settings.backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
    .then(response => {
      debugLog('API response received', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      debugLog('API data parsed successfully', {
        contentLength: data.content ? data.content.length : 0,
        hasCitations: !!data.citations,
        citationsCount: data.citations ? data.citations.length : 0,
        provider: data.provider || settings.provider
      });

      // Hide loading state
      loadingState.classList.add('hidden');
      resultsCard.classList.remove('hidden');

      // Store the response
      currentResponse = data;

      // Display the response with markdown formatting
      try {
        // Configure marked options
        marked.setOptions({
          breaks: true,  // Adds <br> on single line breaks
          gfm: true,     // GitHub Flavored Markdown
          headerIds: false, // Don't add IDs to headers
          sanitize: false // Allow HTML (sanitize: true would strip HTML)
        });

        // Convert markdown to HTML
        const htmlContent = marked.parse(data.content);
        aiResponse.innerHTML = htmlContent;
        debugLog('AI response content rendered with markdown');
      } catch (error) {
        // Fallback to plain text if marked fails
        aiResponse.innerHTML = `<p>${data.content}</p>`;
        debugLog('Markdown parsing failed, using plain text', { error: error.message });
      }

      // Generate dynamic suggestion chips based on the content
      generateSuggestionChips(text, data.content);

      // Handle citations
      if (data.citations && data.citations.length > 0) {
        updateCitations(data.citations);
        citationsSection.classList.remove('hidden');
        citationsLabel.textContent = `Show ${data.citations.length} citations`;
        debugLog('Citations available', { count: data.citations.length });
      } else {
        citationsSection.classList.add('hidden');
        debugLog('No citations available');
      }

      // Add to history
      const historyItem = {
        id: Date.now().toString(),
        query: followUp || 'Analysis of selected text',
        content: data.content,
        citations: data.citations || [],
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        source: window.location.hostname || 'unknown',
        context: text // Store the context for potential follow-up
      };

      addToHistory(historyItem);
      debugLog('Item added to history', { id: historyItem.id, query: historyItem.query });
    })
    .catch(error => {
      debugLog('API request error', {
        message: error.message,
        stack: error.stack
      });
      console.error('Error:', error);
      loadingState.classList.add('hidden');

      // Check if the error is related to API keys
      const isApiKeyError = error.message.toLowerCase().includes('api key') ||
                           error.message.includes('401') ||
                           error.message.includes('403');

      let errorMessage;

      if (isApiKeyError) {
        errorMessage = `
          <div class="error-message">
            <p><strong>API Key Error</strong></p>
            <p>There was a problem with your ${settings.provider} API key.</p>
            <p>Please check that you have:</p>
            <ol>
              <li>Entered a valid API key in the Settings</li>
              <li>Selected the correct API provider</li>
              <li>Verified that your API key has the necessary permissions</li>
            </ol>
            <p><button id="openSettingsBtn" class="primary-button">Open Settings</button></p>
          </div>
        `;
        showNotification('Error: Invalid API key', 'error');
      } else {
        errorMessage = `
          <div class="error-message">
            <p><strong>Error:</strong> Could not get response from the AI service.</p>
            <p>Details: ${error.message}</p>
            <p>Please try again later or check your connection.</p>
            <p>Make sure your API key is correct in the settings.</p>
          </div>
        `;
        showNotification('Error: Failed to get response', 'error');
      }

      // Show the error in the results card
      resultsCard.classList.remove('hidden');
      aiResponse.innerHTML = errorMessage;
      citationsSection.classList.add('hidden');

      // Add event listener for the settings button if it exists
      setTimeout(() => {
        const openSettingsBtn = document.getElementById('openSettingsBtn');
        if (openSettingsBtn) {
          openSettingsBtn.addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
          });
        }
      }, 100);
    });
}

// Save to notebook
function saveToNotebook() {
  debugLog('Saving current response to notebook');

  if (!currentResponse) {
    debugLog('Error: No current response to save');
    return;
  }

  const newItem = {
    id: Date.now().toString(),
    title: currentSelectedText.substring(0, 30) + (currentSelectedText.length > 30 ? '...' : ''),
    content: currentResponse.content,
    citations: currentResponse.citations || [],
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
  };

  debugLog('Created new notebook item', {
    id: newItem.id,
    title: newItem.title,
    contentLength: newItem.content.length,
    citationsCount: newItem.citations.length
  });

  savedItems.unshift(newItem);
  saveSavedItems();
  showNotification('Saved to notebook');
  debugLog('Item added to notebook successfully');
}

// Export notebook
function exportNotebook() {
  debugLog('Starting notebook export', { itemCount: savedItems.length });

  if (savedItems.length === 0) {
    debugLog('Error: No items to export');
    showNotification('No items to export', 'warning');
    return;
  }

  // Create markdown content
  const content = savedItems.map(item => (
    `# ${item.title}\n` +
    `Date: ${item.date}\n\n` +
    `## AI Analysis\n` +
    `${item.content}\n\n` +
    `Citations: ${item.citations.length}\n\n` +
    `---\n\n`
  )).join('');

  debugLog('Markdown content generated', {
    contentLength: content.length,
    items: savedItems.length
  });

  // Create and download the file
  try {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const filename = `sonarsight-${new Date().toISOString().split('T')[0]}.md`;

    debugLog('File blob created', {
      size: blob.size,
      type: blob.type,
      filename
    });

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    debugLog('Export file download initiated');
    showNotification('Exported to Markdown file');
  } catch (error) {
    debugLog('Error during export', {
      error: error.message,
      stack: error.stack
    });
    showNotification('Error exporting notebook', 'error');
  }
}

// Add to history
function addToHistory(item) {
  debugLog('Adding item to history', {
    id: item.id,
    query: item.query,
    contentLength: item.content.length,
    citationsCount: item.citations.length
  });

  historyItems.unshift(item);

  // Limit history to 50 items
  if (historyItems.length > 50) {
    debugLog('Trimming history to 50 items', {
      previousLength: historyItems.length,
      newLength: 50
    });
    historyItems = historyItems.slice(0, 50);
  }

  saveHistoryItems();
  debugLog('History saved to storage', { totalItems: historyItems.length });
}

// Update notebook view
function updateNotebookView() {
  debugLog('Updating notebook view', { savedItemsCount: savedItems.length });

  if (savedItems.length === 0) {
    noSavedItems.classList.remove('hidden');
    savedItemsList.innerHTML = '';
    debugLog('No saved items, showing empty state');
    return;
  }

  noSavedItems.classList.add('hidden');
  let html = '';

  savedItems.forEach(item => {
    html += `
      <div class="saved-item" data-id="${item.id}">
        <div class="saved-item-header">
          <h3 class="saved-item-title">${item.title}</h3>
          <div class="saved-item-actions">
            <button class="saved-item-action edit-action">
              <i class="fas fa-edit"></i>
            </button>
            <button class="saved-item-action delete-action">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>

        <p class="saved-item-date">Saved on ${item.date}</p>

        <div class="saved-item-content">${tryRenderMarkdown(item.content)}</div>

        <div class="saved-item-footer">
          <div class="saved-item-citations">
            <i class="fas fa-external-link-alt"></i>
            <span>${item.citations.length} citations</span>
          </div>
          <button class="saved-item-view">View full</button>
        </div>
      </div>
    `;
  });

  savedItemsList.innerHTML = html;
  debugLog('Notebook items rendered', { count: savedItems.length });

  // Add event listeners for delete buttons
  document.querySelectorAll('.delete-action').forEach(button => {
    button.addEventListener('click', e => {
      const id = e.target.closest('.saved-item').dataset.id;
      debugLog('Delete button clicked for item', { id });
      deleteSavedItem(id);
    });
  });

  // Add event listeners for view buttons
  document.querySelectorAll('.saved-item-view').forEach(button => {
    button.addEventListener('click', e => {
      const id = e.target.closest('.saved-item').dataset.id;
      const item = savedItems.find(s => s.id === id);
      if (item) {
        debugLog('Saved item view button clicked', { id });
        // Display full item in a modal or expand the card
      }
    });
  });
}

// Update history view
function updateHistoryView() {
  debugLog('Updating history view', { historyItemsCount: historyItems.length });

  if (historyItems.length === 0) {
    noHistoryItems.classList.remove('hidden');
    historyTimeline.innerHTML = '';
    loadMoreHistory.classList.add('hidden');
    debugLog('No history items, showing empty state');
    return;
  }

  noHistoryItems.classList.add('hidden');
  let html = '';

  // Display only the first 10 items
  const displayItems = historyItems.slice(0, 10);
  debugLog('Displaying history items', {
    totalItems: historyItems.length,
    displayingItems: displayItems.length
  });

  displayItems.forEach((item, index) => {
    html += `
      <div class="history-item">
        <div class="history-marker ${index === 0 ? 'current' : ''}"></div>
        <div class="history-card">
          <p class="history-timestamp">${item.timestamp}</p>
          <p class="history-query">${item.query}</p>
          <div class="history-footer">
            <span class="history-source">from <span class="source-name">${item.source}</span></span>
            <button class="history-view-btn" data-id="${item.id}">View results</button>
          </div>
        </div>
      </div>
    `;
  });

  historyTimeline.innerHTML = html;

  // Show/hide load more button
  if (historyItems.length > 10) {
    loadMoreHistory.classList.remove('hidden');
    debugLog('Load more button displayed', { remainingItems: historyItems.length - 10 });
  } else {
    loadMoreHistory.classList.add('hidden');
    debugLog('Load more button hidden, no additional items');
  }

  // Add event listeners for view buttons
  document.querySelectorAll('.history-view-btn').forEach(button => {
    button.addEventListener('click', e => {
      const id = e.target.dataset.id;
      const item = historyItems.find(h => h.id === id);
      if (item) {
        debugLog('History item view button clicked', {
          id,
          query: item.query,
          hasContext: !!item.context
        });

        // Set the context and view it
        currentSelectedText = item.context || '';
        displaySelectedText(currentSelectedText);

        // Display the saved response
        loadingState.classList.add('hidden');
        resultsCard.classList.remove('hidden');

        // Show the insights tab
        setActiveTab('insights');

        // Display the response
        currentResponse = {
          content: item.content,
          citations: item.citations
        };

        // Display the response with markdown formatting
        try {
          aiResponse.innerHTML = tryRenderMarkdown(item.content);
          debugLog('History item content displayed with markdown');
        } catch (error) {
          aiResponse.innerHTML = `<p>${item.content}</p>`;
          debugLog('Markdown parsing failed for history item, using plain text');
        }

        // Generate dynamic suggestion chips based on the context
        if (item.context) {
          generateSuggestionChips(item.context, item.content);
        }

        // Handle citations
        if (item.citations && item.citations.length > 0) {
          updateCitations(item.citations);
          citationsSection.classList.remove('hidden');
          citationsLabel.textContent = `Show ${item.citations.length} citations`;
          debugLog('Citations displayed for history item', { count: item.citations.length });
        } else {
          citationsSection.classList.add('hidden');
          debugLog('No citations for history item');
        }
      }
    });
  });
}

// Update citations list
function updateCitations(citations) {
  debugLog('Updating citations list', { count: citations.length });

  // Generate citations list
  let citationsHTML = '<ul>';
  citations.forEach((citation, index) => {
    citationsHTML += `
      <li class="citation-item">
        <div class="citation-number">${index + 1}</div>
        <div class="citation-content">
          <p>Source ${index + 1}</p>
          <a href="${citation}" target="_blank" rel="noopener noreferrer">${citation}</a>
        </div>
      </li>
    `;
  });
  citationsHTML += '</ul>';

  citationsList.innerHTML = citationsHTML;
  debugLog('Citations list rendered');
}

// Delete saved item
function deleteSavedItem(id) {
  debugLog('Deleting saved item', { id });
  const beforeCount = savedItems.length;
  savedItems = savedItems.filter(item => item.id !== id);
  debugLog('Item deleted', {
    beforeCount,
    afterCount: savedItems.length,
    removed: beforeCount - savedItems.length
  });

  saveSavedItems();
  updateNotebookView();
  showNotification('Item deleted');
}

// Show notification
function showNotification(message, type = 'success') {
  debugLog('Showing notification', { message, type });

  notificationText.textContent = message;

  // Set notification type
  notification.className = 'notification';
  notification.classList.add(`notification-${type}`);

  // Show notification
  notification.classList.remove('hidden');

  // Hide after 3 seconds
  setTimeout(() => {
    notification.classList.add('hidden');
    debugLog('Notification hidden');
  }, 3000);
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
        debugLog('Error parsing saved items', {
          error: error.message,
          data: data.savedItems.substring(0, 100) + '...'
        });
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

// Save saved items
function saveSavedItems() {
  debugLog('Saving items to storage', { count: savedItems.length });

  try {
    const savedItemsJson = JSON.stringify(savedItems);
    chrome.storage.local.set({ savedItems: savedItemsJson }, () => {
      if (chrome.runtime.lastError) {
        debugLog('Error saving items', { error: chrome.runtime.lastError });
      } else {
        debugLog('Items saved successfully');
      }
    });
  } catch (error) {
    debugLog('Error stringifying saved items', { error: error.message });
  }
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
        debugLog('Error parsing history items', {
          error: error.message,
          data: data.historyItems.substring(0, 100) + '...'
        });
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

// Helper function to try rendering markdown or return fallback HTML
function tryRenderMarkdown(text) {
  try {
    // Configure marked options for consistent rendering
    marked.setOptions({
      breaks: true,  // Adds <br> on single line breaks
      gfm: true,     // GitHub Flavored Markdown
      headerIds: false, // Don't add IDs to headers
      sanitize: false // Allow HTML (sanitize: true would strip HTML)
    });

    return marked.parse(text);
  } catch (error) {
    debugLog('Markdown parsing failed', { error: error.message });
    return `<p>${text}</p>`;
  }
}

// Save history items
function saveHistoryItems() {
  debugLog('Saving history items to storage', { count: historyItems.length });

  try {
    const historyItemsJson = JSON.stringify(historyItems);
    chrome.storage.local.set({ historyItems: historyItemsJson }, () => {
      if (chrome.runtime.lastError) {
        debugLog('Error saving history items', { error: chrome.runtime.lastError });
      } else {
        debugLog('History items saved successfully');
      }
    });
  } catch (error) {
    debugLog('Error stringifying history items', { error: error.message });
  }
}
