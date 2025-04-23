// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu items
  chrome.contextMenus.create({
    id: "analyzewithsonarsight",
    title: "Analyze with SonarSight",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "opensonarsight",
    title: "Open SonarSight",
    contexts: ["page"]
  });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyzewithsonarsight" && info.selectionText) {
    console.log('Context menu: Selected text:', info.selectionText);

    // Store the selected text in local storage
    chrome.storage.local.set({
      selectedText: info.selectionText,
      selectionSource: tab.url || "unknown source",
      selectionTimestamp: new Date().toISOString()
    }, () => {
      console.log('Context menu: Selection stored in local storage');
    });

    // Update the extension icon to indicate text is selected
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#000000" });

    // Open the popup
    chrome.action.openPopup();
  } else if (info.menuItemId === "opensonarsight") {
    console.log('Context menu: Opening SonarSight without selection');

    // Open the popup without a selection
    chrome.action.openPopup();
  }
});

// We no longer use message passing to avoid connection errors

// We no longer try to inject the content script into all tabs
// This was causing permission errors

// Listen for extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension started, clearing any previous selection");
  // Clear any previous selection on startup
  chrome.storage.local.remove(["selectedText", "selectionSource", "selectionTimestamp"]);
  chrome.action.setBadgeText({ text: "" });
});

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed or updated, clearing any previous selection");
  // Clear any previous selection on install/update
  chrome.storage.local.remove(["selectedText", "selectionSource", "selectionTimestamp"]);
  chrome.action.setBadgeText({ text: "" });
});
