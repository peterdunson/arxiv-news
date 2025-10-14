import { useState, useEffect } from 'react';
import { getPapers } from '../api';
import PaperCard from './PaperCard';

const POSTS_PER_PAGE = 30;

export default function PaperFeed() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadPapers();
  }, []);

  const loadPapers = async () => {
    setLoading(true);
    try {
      const data = await getPapers('votes', 100);
      setPapers(data);
    } catch (error) {
      console.error('Failed to load papers:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <tr>
        <td style={{ padding: '20px', textAlign: 'center' }}>
          Loading papers...
        </td>
      </tr>
    );
  }

  if (papers.length === 0) {
    return (
      <tr>
        <td style={{ padding: '20px', textAlign: 'center' }}>
          No papers found.
        </td>
      </tr>
    );
  }

  const displayedPapers = papers.slice(0, POSTS_PER_PAGE * page);
  const hasMore = papers.length > displayedPapers.length;

  return (
    <tr>
      <td style={{ padding: '0px' }}>
        <table
          style={{
            border: '0px',
            padding: '0px',
            borderCollapse: 'collapse',
            borderSpacing: '0px',
          }}
          className="itemlist"
        >
          <tbody>
            {displayedPapers.map((paper, index) => (
              <PaperCard key={paper.id} paper={paper} rank={index + 1} />
            ))}
            <tr key="morespace" className="morespace" style={{ height: '10px' }} />
            {hasMore && (
              <tr key="morelinktr">
                <td key="morelinkcolspan" colSpan={2} />
                <td key="morelinktd" className="title">
                  <a
                    key="morelink"
                    onClick={() => setPage(page + 1)}
                    className="morelink"
                    style={{ cursor: 'pointer' }}
                  >
                    More
                  </a>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </td>
    </tr>
  );
}