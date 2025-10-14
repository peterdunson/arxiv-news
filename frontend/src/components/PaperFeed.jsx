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
    <div className="max-w-2xl mx-auto">
      {/* Create Post Card */}
      <div className="card bg-base-100 shadow-xl mb-4">
        <div className="card-body p-4">
          <div className="flex items-center gap-3">
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content rounded-full w-10">
                <span>👤</span>
              </div>
            </div>
            <input
              type="text"
              placeholder="Share a new paper or research insight..."
              className="input input-bordered w-full"
              readOnly
            />
          </div>
          <div className="divider my-2"></div>
          <div className="flex justify-around">
            <button className="btn btn-ghost btn-sm gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              Paper
            </button>
            <button className="btn btn-ghost btn-sm gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Note
            </button>
            <button className="btn btn-ghost btn-sm gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Discussion
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="card bg-base-100 shadow-md mb-4">
        <div className="card-body p-4">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`btn btn-sm ${category === cat.id ? 'btn-primary' : 'btn-ghost'}`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sort Tabs */}
      <div className="tabs tabs-boxed bg-base-100 shadow-md mb-4 p-1">
        <a
          className={`tab ${sortBy === 'votes' ? 'tab-active' : ''}`}
          onClick={() => setSortBy('votes')}
        >
          🔥 Hot
        </a>
        <a
          className={`tab ${sortBy === 'recent' ? 'tab-active' : ''}`}
          onClick={() => setSortBy('recent')}
        >
          🆕 New
        </a>
        <a
          className={`tab ${sortBy === 'comments' ? 'tab-active' : ''}`}
          onClick={() => setSortBy('comments')}
        >
          💬 Discussed
        </a>
      </div>

      {/* Papers List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content opacity-60">Loading papers...</p>
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="card-title">No papers found</h2>
            <p className="text-base-content opacity-60">
              Try selecting a different category or check back later!
            </p>
            <button onClick={loadPapers} className="btn btn-primary mt-4">
              Refresh Feed
            </button>
          </div>
        </div>
      ) : (
        <div>
          {filteredPapers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} userId={userId} />
          ))}
        </div>
      )}
    </div>
  );
}