import { useState } from 'react';
import { votePaper } from '../api';

export default function PaperCard({ paper, userId }) {
  const [votes, setVotes] = useState(paper.vote_count);
  const [voted, setVoted] = useState(false);

  const handleVote = async () => {
    try {
      const result = await votePaper(paper.arxiv_id, userId);
      setVotes(result.vote_count);
      setVoted(!voted);
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

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
      <div className="flex gap-4">
        {/* Vote button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleVote}
            className={`p-2 rounded-lg transition-colors ${
              voted
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 hover:bg-purple-100 text-gray-700'
            }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3l2.5 6h6l-5 4 2 6-5.5-4-5.5 4 2-6-5-4h6z" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-700">{votes}</span>
        </div>

        {/* Paper content */}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-purple-600 cursor-pointer">
            <a href={`/paper/${paper.arxiv_id}`}>{paper.title}</a>
          </h2>

          <div className="flex flex-wrap gap-2 mb-3">
            {paper.categories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="px-2 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-medium rounded-full"
              >
                {cat}
              </span>
            ))}
          </div>

          <p className="text-gray-700 mb-3 line-clamp-3">{paper.abstract}</p>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>👥 {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ', et al.' : ''}</span>
            <span>📅 {formatDate(paper.published)}</span>
            <span>💬 {paper.comment_count} comments</span>
          </div>

          <div className="flex gap-3 mt-4">
            <a
              href={paper.arxiv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              📄 arXiv Page
            </a>
            <a
              href={paper.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              📥 PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}