import { useState, useEffect } from 'react';
import { getPapers } from '../api';
import PaperCard from './PaperCard';
import { CATEGORIES, getCategoryName } from '../utils/categories';

export default function PaperFeed() {
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('votes');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [viewMode, setViewMode] = useState('human'); // 'human' or 'llm'
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
    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      loadPapers(true);
    }, 120000);
    return () => clearInterval(interval);
  }, [sortBy]);

  useEffect(() => {
    filterPapersByCategory();
  }, [papers, selectedCategory]);

  const loadPapers = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getPapers(sortBy, 100);
      setPapers(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load papers:', error);
      setError('Failed to load papers. Please check if the backend is running.');
    }
    if (!silent) setLoading(false);
  };

  const filterPapersByCategory = () => {
    if (selectedCategory === 'all') {
      setFilteredPapers(papers);
    } else {
      const filtered = papers.filter(paper =>
        paper.categories.some(cat => cat.startsWith(selectedCategory))
      );
      setFilteredPapers(filtered);
    }
  };

  const formatResultsForLLM = (papers) => {
    const formatted = papers.map((paper, i) => {
      const output = [];
      output.push(`📄 ${paper.title}`);
      output.push(`👥 Authors: ${paper.authors.slice(0, 5).join(', ')}${paper.authors.length > 5 ? ', et al.' : ''}`);
      output.push(`📅 Published: ${new Date(paper.published).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`);
      output.push(`🏷️ Categories: ${paper.categories.join(', ')}`);
      output.push(`🔗 arXiv: ${paper.arxiv_url}`);
      output.push(`📥 PDF: ${paper.pdf_url}`);
      if (paper.comment) {
        output.push(`💬 Note: ${paper.comment}`);
      }
      if (paper.journal_ref) {
        output.push(`📖 Journal: ${paper.journal_ref}`);
      }
      if (paper.doi) {
        output.push(`🔍 DOI: ${paper.doi}`);
      }
      output.push(`\n📝 Abstract:\n${paper.abstract}`);
      return `\n${'#'.repeat(80)}\n# PAPER ${i + 1}\n${'#'.repeat(80)}\n\n${output.join('\n')}`;
    });
    return formatted.join('\n\n');
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      <div className="max-w-6xl mx-auto px-4 py-8" style={{background: 'white', minHeight: '100vh', boxShadow: '0 0 50px rgba(0,0,0,0.1)'}}>
        {/* Header */}
        <h1 className="text-5xl font-bold mb-2" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🔬 arXiv News
        </h1>
        <div className="text-gray-600 mb-8 pb-4 border-b-2 border-gray-200">
          <strong>{papers.length}</strong> papers found
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-3 mb-8 pb-6 border-b-2 border-gray-200">
          <strong className="text-gray-900 text-lg">View:</strong>
          <button
            onClick={() => setViewMode('human')}
            className={`px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-105 ${
              viewMode === 'human'
                ? 'text-white border-0 shadow-xl'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-400 hover:text-purple-600 hover:shadow-lg'
            }`}
            style={viewMode === 'human' ? {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
            } : {}}
          >
            👤 Human
          </button>
          <button
            onClick={() => setViewMode('llm')}
            className={`px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-105 ${
              viewMode === 'llm'
                ? 'text-white border-0 shadow-xl'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-400 hover:text-purple-600 hover:shadow-lg'
            }`}
            style={viewMode === 'llm' ? {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
            } : {}}
          >
            🤖 LLM
          </button>
        </div>

        {/* Human View */}
        {viewMode === 'human' && (
          <>
            {/* Category Filter */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    selectedCategory === 'all'
                      ? 'text-white border-0 shadow-xl'
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-400 hover:text-purple-600 hover:shadow-lg'
                  }`}
                  style={selectedCategory === 'all' ? {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
                  } : {}}
                >
                  📚 All Papers
                </button>
                {CATEGORIES.slice(1).map((cat, index) => {
                  const colors = [
                    'from-pink-500 to-rose-500',
                    'from-blue-500 to-cyan-500',
                    'from-green-500 to-emerald-500',
                    'from-yellow-500 to-orange-500',
                    'from-purple-500 to-indigo-500',
                    'from-red-500 to-pink-500',
                    'from-indigo-500 to-purple-500',
                    'from-teal-500 to-green-500'
                  ];
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                        selectedCategory === cat.id
                          ? 'text-white border-0 shadow-xl'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-400 hover:text-purple-600 hover:shadow-lg'
                      }`}
                      style={selectedCategory === cat.id ? {
                        background: `linear-gradient(135deg, ${colors[index % colors.length].split(' ')[0].replace('from-', '')} 0%, ${colors[index % colors.length].split(' ')[1].replace('to-', '')} 100%)`,
                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
                      } : {}}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Papers */}
            {loading ? (
              <div className="text-center py-12">
                <div
                  className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 mx-auto"
                  style={{borderTopColor: '#667eea'}}
                ></div>
                <p className="mt-4 text-gray-600 font-medium">Loading papers...</p>
              </div>
            ) : error ? (
              <div
                className="bg-white rounded-xl shadow-2xl p-8 text-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(226,232,240,0.8)'
                }}
              >
                <div
                  className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full -translate-y-8 translate-x-8"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    filter: 'blur(40px)'
                  }}
                ></div>
                <div className="text-red-500 text-6xl mb-4 relative z-10">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Oops!</h2>
                <p className="text-gray-600 mb-4 relative z-10">{error}</p>
                <button
                  onClick={() => loadPapers()}
                  className="px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:-translate-y-1 transform relative z-10"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : papers.length === 0 ? (
              <div
                className="bg-white rounded-xl shadow-2xl p-12 text-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(226,232,240,0.8)'
                }}
              >
                <div
                  className="absolute top-0 right-0 w-40 h-40 opacity-5 rounded-full -translate-y-10 translate-x-10"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    filter: 'blur(50px)'
                  }}
                ></div>
                <div className="text-7xl mb-4 relative z-10">📭</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2 relative z-10">No papers yet</h2>
                <p className="text-gray-600 mb-4 relative z-10">
                  Run the scraper to fetch papers from arXiv
                </p>
                <code className="bg-gray-100 px-4 py-2 rounded-lg text-sm text-gray-700 inline-block relative z-10">
                  python backend/scraper.py
                </code>
              </div>
            ) : filteredPapers.length === 0 ? (
              <div
                className="bg-white rounded-xl shadow-2xl p-12 text-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(226,232,240,0.8)'
                }}
              >
                <div
                  className="absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full -translate-y-8 translate-x-8"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    filter: 'blur(40px)'
                  }}
                ></div>
                <div className="text-6xl mb-4 relative z-10">🔍</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">No papers in this category</h2>
                <p className="text-gray-600 mb-4 relative z-10">
                  Try selecting a different category or viewing all papers
                </p>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="px-6 py-2 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:-translate-y-1 transform relative z-10"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  View All Papers
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPapers.map((paper) => (
                  <PaperCard key={paper.id} paper={paper} userId={userId} />
                ))}
              </div>
            )}
          </>
        )}

        {/* LLM View */}
        {viewMode === 'llm' && (
          <div
            className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(226,232,240,0.8)'
            }}
          >
            {/* Decorative gradient blobs */}
            <div
              className="absolute top-0 right-0 w-40 h-40 opacity-5 rounded-full -translate-y-10 translate-x-10"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                filter: 'blur(50px)'
              }}
            ></div>
            <div
              className="absolute bottom-0 left-0 w-32 h-32 opacity-5 rounded-full translate-y-8 -translate-x-8"
              style={{
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                filter: 'blur(40px)'
              }}
            ></div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4 relative z-10">🤖 LLM View – Ready to Copy</h2>
            <p className="text-gray-700 mb-6 relative z-10">
              Copy the text below and paste it into ChatGPT/Claude/etc:
            </p>
            <textarea
              value={formatResultsForLLM(filteredPapers)}
              readOnly
              className="w-full h-96 p-6 border-2 border-gray-300 rounded-xl font-mono text-sm bg-gray-50 text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 relative z-10"
              style={{
                background: 'linear-gradient(135deg, rgba(248,250,252,0.8) 0%, rgba(241,245,249,0.8) 100%)',
                backdropFilter: 'blur(5px)'
              }}
            />
            <div
              className="mt-4 p-4 rounded-xl border-l-4 relative z-10"
              style={{
                background: 'linear-gradient(135deg, rgba(237,242,247,0.8) 0%, rgba(226,232,240,0.8) 100%)',
                borderLeftColor: '#667eea',
                backdropFilter: 'blur(5px)'
              }}
            >
              <p className="text-gray-800 text-sm">
                💡 <strong>Tip:</strong> Click in the text area, press <kbd className="bg-gray-200 px-2 py-1 rounded text-xs">Ctrl+A</kbd> (or <kbd className="bg-gray-200 px-2 py-1 rounded text-xs">Cmd+A</kbd> on Mac), then <kbd className="bg-gray-200 px-2 py-1 rounded text-xs">Ctrl+C</kbd> (or <kbd className="bg-gray-200 px-2 py-1 rounded text-xs">Cmd+C</kbd>) to copy everything.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}