interface SavedItem {
  id: string;
  title: string;
  content: string;
  date: string;
  citations: number;
  sourceText: string;
}

interface NotebookTabProps {
  savedItems: SavedItem[];
  deleteSavedItem: (id: string) => void;
}

export default function NotebookTab({ savedItems, deleteSavedItem }: NotebookTabProps) {
  const exportNotebook = () => {
    const content = savedItems.map(item => (
      `# ${item.title}\n` +
      `Date: ${item.date}\n\n` +
      `## Original Text\n` +
      `${item.sourceText}\n\n` +
      `## AI Analysis\n` +
      `${item.content}\n\n` +
      `Citations: ${item.citations}\n\n` +
      `---\n\n`
    )).join('');
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sonarinsights-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Saved Insights</h2>
        <div className="flex space-x-2">
          <button 
            onClick={exportNotebook}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 py-1 px-2 rounded flex items-center"
          >
            <i className="fas fa-download mr-1"></i> Export
          </button>
          <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 py-1 px-2 rounded flex items-center">
            <i className="fas fa-sort mr-1"></i> Sort
          </button>
        </div>
      </div>
      
      {/* No Saved Items State */}
      {savedItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-primary-100 rounded-full p-4 mb-4">
            <i className="fas fa-bookmark text-3xl text-primary-500"></i>
          </div>
          <h3 className="font-medium text-gray-700 mb-2">No saved insights yet</h3>
          <p className="text-gray-500 text-sm max-w-xs">When you save an analysis, it will appear here for easy reference.</p>
        </div>
      )}
      
      {/* Saved Items List */}
      <div className="space-y-4">
        {savedItems.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-sm text-gray-800">{item.title}</h3>
              <div className="flex space-x-1">
                <button className="text-gray-400 hover:text-primary-600 transition-colors">
                  <i className="fas fa-edit"></i>
                </button>
                <button 
                  onClick={() => deleteSavedItem(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mb-2">Saved on {item.date}</p>
            
            <div className="text-sm text-gray-700 mb-2 line-clamp-3">
              {item.content}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-1 text-xs text-primary-600">
                <i className="fas fa-external-link-alt"></i>
                <span>{item.citations} citations</span>
              </div>
              <button className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                View full
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
