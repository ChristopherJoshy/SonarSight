import { useState, useRef } from "react";
import { apiRequest } from "@/lib/api";
import { marked } from "marked";

interface InsightsTabProps {
  selectedText: string;
  setSelectedText: (text: string) => void;
  aiResponse: { content: string; citations: string[] };
  setAiResponse: (response: { content: string; citations: string[] }) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  saveToNotebook: () => void;
  addToHistory: (historyItem: any) => void;
  showSnackbar: (message: string) => void;
}

export default function InsightsTab({
  selectedText,
  setSelectedText,
  aiResponse,
  setAiResponse,
  isLoading,
  setIsLoading,
  saveToNotebook,
  addToHistory,
  showSnackbar
}: InsightsTabProps) {
  const [followUpInput, setFollowUpInput] = useState<string>("");
  const [showCitations, setShowCitations] = useState<boolean>(false);
  const followUpInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiResponse.content);
    showSnackbar("Copied to clipboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpInput.trim()) return;

    setIsLoading(true);
    try {
      const response = await apiRequest("query", {
        query: followUpInput,
        context: selectedText,
        provider: "gemini", // Default to Gemini instead of Perplexity
        enhancedResults: true,  // Enable enhanced results
        model: "gemini-1.5-pro", // Default model for Gemini
        temperature: 0.3,  // Default temperature
        maxTokens: 1024   // Default max tokens
      });

      setAiResponse({
        content: response.content,
        citations: response.citations || []
      });

      addToHistory({
        id: Date.now().toString(),
        query: followUpInput,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        source: window.location.hostname,
        result: response.content,
        citations: response.citations || []
      });

      setFollowUpInput("");
    } catch (error) {
      console.error("Error fetching data:", error);
      showSnackbar("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setFollowUpInput(prompt);
    if (followUpInputRef.current) {
      followUpInputRef.current.focus();
    }
  };

  return (
    <main className="p-4 max-h-[85vh] overflow-y-auto">
      {/* Selected Text Display */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-200">
        <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
          <i className="fas fa-quote-left text-primary-400 mr-2"></i>
          Selected Text
        </h2>
        <div className="text-sm text-gray-700 italic border-l-4 border-primary-200 pl-3 py-1">
          {selectedText || "No text selected. Select text on any webpage to analyze it."}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow p-6 mb-4 border border-gray-200">
          <div className="flex items-center justify-center space-x-4">
            <div className="animate-pulse h-6 w-6 rounded-full bg-primary-500"></div>
            <div className="text-gray-600 font-medium">Analyzing with SonarSight AI...</div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="h-4 bg-gray-200 rounded-full shimmer"></div>
            <div className="h-4 bg-gray-200 rounded-full w-5/6 shimmer"></div>
            <div className="h-4 bg-gray-200 rounded-full shimmer"></div>
            <div className="h-4 bg-gray-200 rounded-full w-4/6 shimmer"></div>
          </div>
        </div>
      )}

      {/* AI Analysis Results */}
      {!isLoading && aiResponse.content && (
        <div className="bg-white rounded-lg shadow p-4 mb-4 border border-gray-200">
          {/* Result Header */}
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-sm font-semibold text-gray-500 flex items-center">
              <i className="fas fa-robot text-primary-500 mr-2"></i>
              AI Analysis
            </h2>
            <div className="flex space-x-2">
              <button
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 py-1 px-2 rounded flex items-center transition-colors"
                onClick={copyToClipboard}
              >
                <i className="fas fa-copy mr-1"></i> Copy
              </button>
              <button
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 py-1 px-2 rounded flex items-center transition-colors"
                onClick={saveToNotebook}
              >
                <i className="fas fa-bookmark mr-1"></i> Save
              </button>
            </div>
          </div>

          {/* AI Response */}
          <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed text-sm"
            dangerouslySetInnerHTML={{ __html: marked.parse(aiResponse.content) }}
          ></div>

          {/* Citations Section */}
          {aiResponse.citations.length > 0 && (
            <div className="mt-4">
              <button
                className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center"
                onClick={() => setShowCitations(!showCitations)}
              >
                <i className={`fas fa-chevron-${showCitations ? 'up' : 'down'} mr-1`}></i>
                {showCitations ? 'Hide citations' : `Show ${aiResponse.citations.length} citations`}
              </button>

              <div className={`citation-box mt-2 rounded-md bg-gray-50 p-3 text-xs font-mono ${showCitations ? 'open' : ''}`}>
                <ul className="space-y-3">
                  {aiResponse.citations.map((citation, index) => (
                    <li key={index}>
                      <div className="flex items-start">
                        <span className="text-xs bg-primary-100 text-primary-800 rounded-full h-5 w-5 flex items-center justify-center mr-2 flex-shrink-0 font-sans">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-gray-700">Source {index + 1}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            <a
                              href={citation}
                              className="text-primary-500 hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {citation}
                            </a>
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Follow-up Question */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <h2 className="text-sm font-semibold text-gray-500 mb-3 flex items-center">
          <i className="fas fa-comments text-primary-500 mr-2"></i>
          Ask a follow-up question
        </h2>

        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            ref={followUpInputRef}
            value={followUpInput}
            onChange={(e) => setFollowUpInput(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            placeholder="What else would you like to know?"
          />
          <button
            type="submit"
            disabled={isLoading || !followUpInput.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary-600 text-white rounded-full p-1.5 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>

        <div className="mt-3 flex flex-wrap text-xs gap-2">
          <button
            className="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full hover:bg-primary-100 transition-colors"
            onClick={() => handleQuickPrompt("What are ethical concerns?")}
          >
            What are ethical concerns?
          </button>
          <button
            className="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full hover:bg-primary-100 transition-colors"
            onClick={() => handleQuickPrompt("Compare with older AI models")}
          >
            Compare with older AI models
          </button>
          <button
            className="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full hover:bg-primary-100 transition-colors"
            onClick={() => handleQuickPrompt("Future developments?")}
          >
            Future developments?
          </button>
        </div>
      </div>
    </main>
  );
}
