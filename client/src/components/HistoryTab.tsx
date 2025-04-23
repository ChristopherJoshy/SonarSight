interface HistoryItem {
  id: string;
  query: string;
  timestamp: string;
  source: string;
  result: string;
  citations: string[];
}

interface HistoryTabProps {
  historyItems: HistoryItem[];
  setSelectedText: (text: string) => void;
  setActiveTab: (tab: 'insights' | 'notebook' | 'history') => void;
}

export default function HistoryTab({ historyItems, setSelectedText, setActiveTab }: HistoryTabProps) {
  const handleViewResult = (item: HistoryItem) => {
    setSelectedText(item.query);
    setActiveTab('insights');
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Queries</h2>
      
      {historyItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-primary-100 rounded-full p-4 mb-4">
            <i className="fas fa-history text-3xl text-primary-500"></i>
          </div>
          <h3 className="font-medium text-gray-700 mb-2">No history yet</h3>
          <p className="text-gray-500 text-sm max-w-xs">Your query history will appear here as you analyze content.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-primary-200 pl-6 pb-4 space-y-6 ml-2">
          {historyItems.map((item, index) => (
            <div key={item.id} className="relative">
              <div className={`absolute -left-8 top-1 h-4 w-4 rounded-full ${index === 0 ? 'bg-primary-500' : 'bg-primary-200'}`}></div>
              <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">{item.timestamp}</p>
                <p className="text-sm font-medium text-gray-800 mb-2">{item.query}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">from <span className="text-primary-600">{item.source}</span></span>
                  <button 
                    onClick={() => handleViewResult(item)}
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                  >
                    View results
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {historyItems.length > 5 && (
        <div className="text-center mt-4">
          <button className="text-primary-600 hover:text-primary-800 text-sm font-medium">
            Load more history
          </button>
        </div>
      )}
    </div>
  );
}
