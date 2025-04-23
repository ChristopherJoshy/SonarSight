// Mock server response for SonarSight extension
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

// Export the mock function
window.mockAnalyzeText = mockAnalyzeText;
