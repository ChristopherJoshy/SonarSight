// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item
  chrome.contextMenus.create({
    id: "analyzewithsonarsight",
    title: "Analyze with SonarSight",
    contexts: ["selection"]
  });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyzewithsonarsight" && info.selectionText) {
    // Store the selected text in local storage
    chrome.storage.local.set({ 
      selectedText: info.selectionText,
      selectionSource: tab.url || "unknown source",
      selectionTimestamp: new Date().toISOString()
    });
    
    // Open the popup
    chrome.action.openPopup();
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "textSelected") {
    // Store the selected text
    chrome.storage.local.set({ 
      selectedText: message.text,
      selectionSource: sender.tab?.url || "unknown source",
      selectionTimestamp: new Date().toISOString()
    });
    
    // Update the extension icon to indicate text is selected
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#6d28d9" });
    
    sendResponse({ success: true });
  }
  
  return true;
});
