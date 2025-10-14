import { useState, useEffect } from 'react';
import { getPapers } from '../api';
import PaperCard from './PaperCard';

export default function PaperFeed() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('votes');
  const [userId] = useState(() => {
    let id = localStorage.getItem('userId');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', id);
    }
    return id;
  });

  useEffect(() => {
    loadPapers();
  }, [sortBy]);

  const loadPapers = async () => {
    setLoading(true);
    try {
      const data = await getPapers(sortBy, 20);
      setPapers(data);
    } catch (error) {
      console.error('Failed to load papers:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            🔬 arXiv News
          </h1>
          <p className="text-gray-600">Latest research papers from arXiv</p>
        </header>

        {/* Sort tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg p-1 shadow-sm">
          {['votes', 'recent', 'comments'].map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                sortBy === sort
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {sort === 'votes' ? '🔥 Hot' : sort === 'recent' ? '🆕 New' : '💬 Discussed'}
            </button>
          ))}
        </div>

        {/* Papers */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading papers...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {papers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} userId={userId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}