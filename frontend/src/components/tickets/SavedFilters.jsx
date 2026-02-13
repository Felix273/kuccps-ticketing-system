import React, { useState, useEffect } from 'react';
import { Save, Bookmark, Trash2, Edit2 } from 'lucide-react';

export const SavedFilters = ({ onLoadFilter, currentFilters }) => {
  const [savedFilters, setSavedFilters] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');

  useEffect(() => {
    // Load saved filters from localStorage
    const saved = localStorage.getItem('ticketFilters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  const saveFilter = () => {
    if (!filterName.trim()) {
      alert('Please enter a filter name');
      return;
    }

    const newFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: currentFilters,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('ticketFilters', JSON.stringify(updated));
    
    setFilterName('');
    setShowSaveDialog(false);
    alert('Filter saved successfully!');
  };

  const deleteFilter = (id) => {
    if (!confirm('Delete this saved filter?')) return;
    
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem('ticketFilters', JSON.stringify(updated));
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Bookmark className="w-4 h-4" />
          Saved Filters
        </h3>
        <button
          onClick={() => setShowSaveDialog(!showSaveDialog)}
          className="px-3 py-1 bg-[#911414] text-white rounded-lg text-xs font-medium hover:bg-[#ac0807] transition-colors flex items-center gap-1"
        >
          <Save className="w-3 h-3" />
          Save Current
        </button>
      </div>

      {showSaveDialog && (
        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <input
            type="text"
            placeholder="Filter name..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-[#911414] focus:border-transparent"
          />
          <div className="flex gap-2">
            <button
              onClick={saveFilter}
              className="flex-1 px-3 py-1 bg-[#911414] text-white rounded text-xs font-medium hover:bg-[#ac0807]"
            >
              Save
            </button>
            <button
              onClick={() => {setShowSaveDialog(false); setFilterName('');}}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {savedFilters.length > 0 ? (
        <div className="space-y-2">
          {savedFilters.map(filter => (
            <div
              key={filter.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#911414] transition-colors"
            >
              <button
                onClick={() => onLoadFilter(filter.filters)}
                className="flex-1 text-left text-sm font-medium text-gray-700 hover:text-[#911414]"
              >
                {filter.name}
              </button>
              <button
                onClick={() => deleteFilter(filter.id)}
                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic">No saved filters yet</p>
      )}
    </div>
  );
};
