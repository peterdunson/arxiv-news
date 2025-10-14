import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { votePaper } from '../api';
import { getCategoryName } from '../utils/categories';

export default function PaperCard({ paper, userId }) {
  const navigate = useNavigate();
  const [votes, setVotes] = useState(paper.vote_count);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    // Check if user has voted for this paper
    const votedPapers = JSON.parse(localStorage.getItem('votedPapers') || '{}');
    setVoted(!!votedPapers[paper.arxiv_id]);
  }, [paper.arxiv_id]);

  const handleVote = async (e) => {
    e.stopPropagation(); // Prevent navigation when clicking vote button
    try {
      const result = await votePaper(paper.arxiv_id, userId);
      setVotes(result.vote_count);
      const newVotedState = !voted;
      setVoted(newVotedState);

      // Persist voted state
      const votedPapers = JSON.parse(localStorage.getItem('votedPapers') || '{}');
      if (newVotedState) {
        votedPapers[paper.arxiv_id] = true;
      } else {
        delete votedPapers[paper.arxiv_id];
      }
      localStorage.setItem('votedPapers', JSON.stringify(votedPapers));
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAuthors = (authors, maxAuthors = 5) => {
    if (authors.length <= maxAuthors) {
      return authors.join(', ');
    } else {
      return authors.slice(0, maxAuthors).join(', ') + ', et al.';
    }
  };

  return (
    <section
      className="bg-white border border-gray-200 rounded-xl p-8 mb-6 shadow-md hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer relative overflow-hidden"
      onClick={() => navigate(`/paper/${paper.arxiv_id}`)}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(226,232,240,0.8)'
      }}
    >
      {/* Decorative gradient blob */}
      <div
        className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full -translate-y-8 translate-x-8"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          filter: 'blur(40px)'
        }}
      ></div>

      <div className="flex gap-6 relative z-10">
        {/* Vote button */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <button
            onClick={handleVote}
            className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${
              voted
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'bg-white border-2 border-purple-600 text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 hover:text-white hover:shadow-lg'
            }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3l2.5 6h6l-5 4 2 6-5.5-4-5.5 4 2-6-5-4h6z" />
            </svg>
          </button>
          <span className={`text-sm font-bold ${voted ? 'text-purple-600' : 'text-gray-700'}`}>{votes}</span>
        </div>

        {/* Paper content */}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-3 leading-snug hover:text-purple-700 transition-colors">
            {paper.title}
          </h2>

          <div className="meta flex flex-wrap gap-4 mb-4 text-sm">
            <span className="authors text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-full">
              👥 {formatAuthors(paper.authors)}
            </span>
            <span className="date text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
              📅 {formatDate(paper.published)}
            </span>
            <span className="text-gray-600 bg-green-50 px-3 py-1 rounded-full">
              💬 <strong>{paper.comment_count}</strong> comments
            </span>
          </div>

          <div className="categories mb-4 flex flex-wrap gap-2">
            {paper.categories.slice(0, 3).map((cat, index) => {
              const colors = [
                'from-pink-500 to-rose-500',
                'from-blue-500 to-cyan-500',
                'from-green-500 to-emerald-500',
                'from-yellow-500 to-orange-500',
                'from-purple-500 to-indigo-500',
                'from-red-500 to-pink-500'
              ];
              return (
                <span
                  key={cat}
                  className={`px-4 py-2 bg-gradient-to-r ${colors[index % colors.length]} text-white text-xs font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-help`}
                  title={cat}
                >
                  {getCategoryName(cat)}
                </span>
              );
            })}
          </div>

          <div
            className="abstract p-5 rounded-xl mb-4 border-l-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(248,250,252,0.8) 0%, rgba(241,245,249,0.8) 100%)',
              borderLeftColor: '#667eea',
              backdropFilter: 'blur(5px)'
            }}
          >
            <div
              className="absolute top-0 right-0 w-20 h-20 opacity-5 rounded-full -translate-y-4 translate-x-4"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                filter: 'blur(20px)'
              }}
            ></div>
            <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed relative z-10">{paper.abstract}</p>
          </div>

          {/* Optional extras */}
          {(paper.comment || paper.journal_ref || paper.doi) && (
            <div
              className="extras text-sm text-gray-600 mb-4 p-4 rounded-xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(241,245,249,0.8) 0%, rgba(226,232,240,0.8) 100%)',
                backdropFilter: 'blur(5px)'
              }}
            >
              <div
                className="absolute top-0 right-0 w-16 h-16 opacity-5 rounded-full -translate-y-2 translate-x-2"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  filter: 'blur(15px)'
                }}
              ></div>
              {paper.comment && <div className="relative z-10">💬 {paper.comment}</div>}
              {paper.journal_ref && <div className="relative z-10">📖 {paper.journal_ref}</div>}
              {paper.doi && (
                <div className="relative z-10">
                  🔍 DOI:{' '}
                  <a
                    href={`https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800 underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {paper.doi}
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="links flex gap-4">
            <a
              href={paper.arxiv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border-2 border-purple-600 bg-white text-purple-600 rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 hover:text-white hover:-translate-y-1 hover:shadow-xl transform"
              onClick={(e) => e.stopPropagation()}
            >
              📄 arXiv Page
            </a>
            <a
              href={paper.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 transform border-0"
              onClick={(e) => e.stopPropagation()}
            >
              📥 Download PDF
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}