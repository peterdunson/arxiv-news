import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPapers } from '../api';
import PaperCard from './PaperCard';

const POSTS_PER_PAGE = 30;

export default function PaperFeed() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('cat') || 'all';
  const sortBy = searchParams.get('sort') || 'hot';
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadPapers();
  }, [sortBy]);

  useEffect(() => {
    filterAndSortPapers();
  }, [papers, category, sortBy]);

  const loadPapers = async () => {
    setLoading(true);
    try {
      // Map sort parameter to API sort parameter
      const apiSort = sortBy === 'hot' ? 'votes' : sortBy === 'discussed' ? 'comments' : 'recent';
      const data = await getPapers(apiSort, 100);
      setPapers(data);
    } catch (error) {
      console.error('Failed to load papers:', error);
    }
    setLoading(false);
  };

  const filterAndSortPapers = () => {
    let filtered = papers;
    
    // Filter by category
    if (category !== 'all') {
      filtered = papers.filter(p => 
        p.categories.some(cat => cat.startsWith(category))
      );
    }
    
    // Client-side sorting
    if (sortBy === 'hot') {
      // Filter to last 7 days, then sort by votes (highest first)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      filtered = filtered
        .filter(p => new Date(p.published) >= oneWeekAgo)
        .sort((a, b) => b.vote_count - a.vote_count);
    } else if (sortBy === 'discussed') {
      // Filter to last 7 days, then sort by comments (most discussed first)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      filtered = filtered
        .filter(p => new Date(p.published) >= oneWeekAgo)
        .sort((a, b) => b.comment_count - a.comment_count);
    } else if (sortBy === 'new') {
      // Sort by publication date (newest first) - show all papers
      filtered = [...filtered].sort((a, b) => 
        new Date(b.published).getTime() - new Date(a.published).getTime()
      );
    }
    
    setFilteredPapers(filtered);
  };

  const getCategoryName = (cat) => {
    const names = {
      'all': 'All Papers',
      'cs.AI': 'Artificial Intelligence',
      'cs.LG': 'Machine Learning',
      'cs.CL': 'Natural Language Processing',
      'cs.CV': 'Computer Vision',
      'cs.RO': 'Robotics',
      'stat.ML': 'Statistics',
      'math': 'Mathematics',
      'physics': 'Physics',
      'quant-ph': 'Quantum Physics'
    };
    return names[cat] || cat;
  };

  const getSortName = (sort) => {
    const names = {
      'new': 'Newest Papers',
      'hot': 'Most Upvoted (Last 7 Days)',
      'discussed': 'Most Discussed (Last 7 Days)'
    };
    return names[sort] || 'Most Upvoted (Last 7 Days)';
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

  if (filteredPapers.length === 0 && !loading) {
    return (
      <tr>
        <td style={{ padding: '20px', textAlign: 'center' }}>
          No papers found in this category.
        </td>
      </tr>
    );
  }

  const displayedPapers = filteredPapers.slice(0, POSTS_PER_PAGE * page);
  const hasMore = filteredPapers.length > displayedPapers.length;

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
            {/* Filter indicator */}
            <tr>
              <td colSpan={3} style={{ padding: '10px 0', fontSize: '11pt' }}>
                <span style={{ color: '#828282' }}>
                  Showing: <b style={{ color: '#000000' }}>{getSortName(sortBy)}</b>
                  {category !== 'all' && (
                    <>
                      {' in '}
                      <b style={{ color: '#000000' }}>{getCategoryName(category)}</b>
                    </>
                  )}
                  {' '}
                  ({filteredPapers.length} paper{filteredPapers.length !== 1 ? 's' : ''})
                </span>
              </td>
            </tr>
            <tr style={{ height: '5px' }} />
            
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