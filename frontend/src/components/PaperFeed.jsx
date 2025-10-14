import { useState, useEffect } from 'react';
import { getPapers } from '../api';
import PaperCard from './PaperCard';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '📚' },
  { id: 'cs.AI', name: 'AI', icon: '🤖' },
  { id: 'cs.LG', name: 'ML', icon: '🧠' },
  { id: 'cs.CL', name: 'NLP', icon: '💬' },
  { id: 'cs.CV', name: 'Vision', icon: '👁️' },
  { id: 'cs.RO', name: 'Robotics', icon: '🤖' },
  { id: 'stat.ML', name: 'Stats', icon: '📊' },
  { id: 'math', name: 'Math', icon: '➕' },
  { id: 'quant-ph', name: 'Quantum', icon: '⚡' },
];

export default function PaperFeed() {
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('votes');
  const [category, setCategory] = useState('all');
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

  useEffect(() => {
    filterPapers();
  }, [papers, category]);

  const loadPapers = async () => {
    setLoading(true);
    try {
      const data = await getPapers(sortBy, 100);
      setPapers(data);
    } catch (error) {
      console.error('Failed to load papers:', error);
    }
    setLoading(false);
  };

  const filterPapers = () => {
    if (category === 'all') {
      setFilteredPapers(papers);
    } else {
      setFilteredPapers(papers.filter(p => 
        p.categories.some(cat => cat.startsWith(category))
      ));
    }
  };

  return (
    <div style={{background: '#f8f9fa', minHeight: '100vh'}}>
      <div className="max-width-container">
        {/* Header */}
        <header className="mb-6">
          <h1 className="gradient-text">🔬 arXiv News</h1>
          <p className="text-gray-600">Latest research papers from arXiv</p>
        </header>

        {/* Category filters */}
        <div className="category-filters">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`category-btn ${category === cat.id ? 'active' : ''}`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Sort tabs */}
        <div className="sort-tabs">
          {['votes', 'recent', 'comments'].map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={`sort-tab ${sortBy === sort ? 'active' : ''}`}
            >
              {sort === 'votes' ? '🔥 Hot' : sort === 'recent' ? '🆕 New' : '💬 Discussed'}
            </button>
          ))}
        </div>

        {/* Papers */}
        {loading ? (
          <div className="text-center py-12">
            <div className="spinner"></div>
            <p className="mt-4 text-gray-600">Loading papers...</p>
          </div>
        ) : (
          <div className="papers-list">
            {filteredPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} userId={userId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}