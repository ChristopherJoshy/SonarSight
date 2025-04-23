// SonarSight Content Script - Completely rewritten for reliability

// Immediately store the selection in local storage when the script loads
(function() {
  console.log("SonarSight content script loaded - v4");

  // Global variables
  let lastSelection = '';
  let selectionChangeTimer = null;

  // Function to get the current selection text
  function getSelectionText() {
    let text = '';

    // Try window.getSelection() first (works in most browsers)
    if (window.getSelection) {
      text = window.getSelection().toString().trim();
    }
    // Fallback to document.selection for older IE
    else if (document.selection && document.selection.type !== 'Control') {
      text = document.selection.createRange().text.trim();
    }

    // If no text was found, check active element (for input fields, etc.)
    if (!text && document.activeElement) {
      const activeElement = document.activeElement;
      if ((activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') &&
          'selectionStart' in activeElement &&
          activeElement.selectionStart !== activeElement.selectionEnd) {
        text = activeElement.value.substring(activeElement.selectionStart, activeElement.selectionEnd).trim();
      }
    }

    return text;
  }

  // Function to store selection in Chrome storage
  function storeSelection(text) {
    if (!text || text.length === 0) {
      return false; // Don't store empty selections
    }

    // Only log if it's a new selection
    if (text !== lastSelection) {
      console.log('SonarSight: New selection detected:',
        text.substring(0, 30) + (text.length > 30 ? '...' : ''));
    }

    // Update last selection
    lastSelection = text;

    // Store in Chrome storage
    try {
      chrome.storage.local.set({
        selectedText: text,
        selectionSource: window.location.href || 'unknown source',
        selectionTimestamp: new Date().toISOString()
      }, () => {
        console.log('SonarSight: Selection stored in storage');

        // Set badge to indicate text is selected
        try {
          chrome.action.setBadgeText({ text: '!' });
          chrome.action.setBadgeBackgroundColor({ color: '#000000' });
        } catch (e) {
          // This is expected to fail in some contexts
          console.log('SonarSight: Could not set badge (expected)');
        }
      });
      return true;
    } catch (e) {
      console.error('SonarSight: Error storing selection:', e);
      return false;
    }
  }

  // Function to check for selection and store it
  function checkForSelection() {
    const text = getSelectionText();
    if (text) {
      storeSelection(text);
    }
  }

  // Debounced version of checkForSelection
  function debouncedCheckForSelection() {
    clearTimeout(selectionChangeTimer);
    selectionChangeTimer = setTimeout(checkForSelection, 300);
  }

  // Set up event listeners for selection changes
  document.addEventListener('mouseup', debouncedCheckForSelection);
  document.addEventListener('dblclick', debouncedCheckForSelection); // Add double-click handler
  document.addEventListener('keyup', (e) => {
    // Only check for selection-related keys
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
        e.key === 'Home' || e.key === 'End' ||
        e.key === 'PageUp' || e.key === 'PageDown' ||
        e.ctrlKey || e.metaKey) {
      debouncedCheckForSelection();
    }
  });
  document.addEventListener('selectionchange', debouncedCheckForSelection);

  // Check for selection when the script loads
  setTimeout(checkForSelection, 500);

  // Set up a recurring check for selections
  setInterval(checkForSelection, 1000);

  // We no longer use message passing to avoid connection errors
})();
