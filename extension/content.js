// Listen for selection changes
document.addEventListener('mouseup', function() {
  const selectedText = window.getSelection().toString().trim();
  
  // If text is selected, send it to the background script
  if (selectedText.length > 0) {
    chrome.runtime.sendMessage({
      type: "textSelected",
      text: selectedText
    });
  }
});

// Add double-click handler for faster text selection
document.addEventListener('dblclick', function(e) {
  const selectedText = window.getSelection().toString().trim();
  
  if (selectedText.length > 0) {
    chrome.runtime.sendMessage({
      type: "textSelected",
      text: selectedText
    });
  }
});
