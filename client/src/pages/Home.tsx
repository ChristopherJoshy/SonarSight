import { useState } from "react";
import InsightsTab from "@/components/InsightsTab";
import NotebookTab from "@/components/NotebookTab";
import HistoryTab from "@/components/HistoryTab";
import SnackbarNotification from "@/components/SnackbarNotification";

type TabType = 'insights' | 'notebook' | 'history';

interface SavedItem {
  id: string;
  title: string;
  content: string;
  date: string;
  citations: number;
  sourceText: string;
}

interface HistoryItem {
  id: string;
  query: string;
  timestamp: string;
  source: string;
  result: string;
  citations: string[];
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('insights');
  const [selectedText, setSelectedText] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<{content: string, citations: string[]}>({
    content: "",
    citations: []
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    const stored = localStorage.getItem('sonarSightSaved');
    return stored ? JSON.parse(stored) : [];
  });
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => {
    const stored = localStorage.getItem('sonarSightHistory');
    return stored ? JSON.parse(stored) : [];
  });
  const [snackbar, setSnackbar] = useState<{visible: boolean, message: string}>({
    visible: false,
    message: ""
  });

  const showSnackbar = (message: string) => {
    setSnackbar({ visible: true, message });
    setTimeout(() => setSnackbar({ visible: false, message: "" }), 3000);
  };

  const saveToNotebook = () => {
    if (!aiResponse.content) return;
    
    const newItem: SavedItem = {
      id: Date.now().toString(),
      title: selectedText.length > 30 ? selectedText.substring(0, 30) + "..." : selectedText,
      content: aiResponse.content,
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      citations: aiResponse.citations.length,
      sourceText: selectedText
    };
    
    const updatedItems = [newItem, ...savedItems];
    setSavedItems(updatedItems);
    localStorage.setItem('sonarSightSaved', JSON.stringify(updatedItems));
    showSnackbar("Saved to notebook");
  };

  const addToHistory = (item: HistoryItem) => {
    const updatedHistory = [item, ...historyItems];
    setHistoryItems(updatedHistory);
    localStorage.setItem('sonarSightHistory', JSON.stringify(updatedHistory));
  };

  const deleteSavedItem = (id: string) => {
    const updatedItems = savedItems.filter(item => item.id !== id);
    setSavedItems(updatedItems);
    localStorage.setItem('sonarSightSaved', JSON.stringify(updatedItems));
    showSnackbar("Item deleted");
  };

  return (
    <div className="min-h-screen font-sans text-gray-800 bg-gray-50">
      {/* Header */}
      <header className="bg-primary-700 text-white p-4 shadow-md relative z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <i className="fas fa-broadcast-tower text-2xl text-white"></i>
            <h1 className="font-bold text-xl">SonarSight</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              className="text-white p-1.5 rounded-full hover:bg-primary-600 transition-colors flex items-center"
              onClick={() => {
                // Open settings modal logic would go here
                console.log('Settings button clicked');
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button 
              className="text-white p-1.5 rounded-full hover:bg-primary-600 transition-colors flex items-center"
              onClick={() => {
                // Open help modal logic would go here
                console.log('Help button clicked');
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <path d="M12 17h.01"></path>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <nav className="flex mt-4 border-b border-primary-500">
          <button 
            onClick={() => setActiveTab('insights')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'insights' 
                ? 'border-white text-white' 
                : 'border-transparent text-primary-200 hover:text-white'
            }`}
          >
            Insights
          </button>
          <button 
            onClick={() => setActiveTab('notebook')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'notebook' 
                ? 'border-white text-white' 
                : 'border-transparent text-primary-200 hover:text-white'
            }`}
          >
            Notebook
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history' 
                ? 'border-white text-white' 
                : 'border-transparent text-primary-200 hover:text-white'
            }`}
          >
            History
          </button>
        </nav>
      </header>

      {/* Tab Content */}
      {activeTab === 'insights' && (
        <InsightsTab 
          selectedText={selectedText}
          setSelectedText={setSelectedText}
          aiResponse={aiResponse}
          setAiResponse={setAiResponse}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          saveToNotebook={saveToNotebook}
          addToHistory={addToHistory}
          showSnackbar={showSnackbar}
        />
      )}

      {activeTab === 'notebook' && (
        <NotebookTab 
          savedItems={savedItems}
          deleteSavedItem={deleteSavedItem}
        />
      )}

      {activeTab === 'history' && (
        <HistoryTab
          historyItems={historyItems}
          setSelectedText={setSelectedText}
          setActiveTab={setActiveTab}
        />
      )}

      {/* Snackbar Notification */}
      <SnackbarNotification 
        visible={snackbar.visible}
        message={snackbar.message}
      />
    </div>
  );
}
