import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPapers } from '../api';
import PaperCard from './PaperCard';
import { CATEGORY_MAP, ALL_CATEGORIES } from '../utils/categories';

const POSTS_PER_PAGE = 30;

export default function PaperFeed() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('cat') || 'all';
  const sortBy = searchParams.get('sort') || 'hot';
  const searchQuery = searchParams.get('q') || '';
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadPapers();
  }, [sortBy]);

  useEffect(() => {
    filterAndSortPapers();
  }, [papers, category, sortBy, searchQuery]);

  const loadPapers = async () => {
    setLoading(true);
    try {
      // Map sort parameter to API sort parameter
      const apiSort = sortBy === 'hot' ? 'votes' : sortBy === 'discussed' ? 'comments' : 'recent';
      const data = await getPapers(apiSort, 15000); // Fetch more papers to show all available
      setPapers(data);
    } catch (error) {
      console.error('Failed to load papers:', error);
    }
    setLoading(false);
  };

  const filterAndSortPapers = () => {
    let filtered = papers;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        try {
          // Title match
          const titleMatch = p.title && p.title.toLowerCase().includes(query);
          
          // Abstract match
          const abstractMatch = p.abstract && p.abstract.toLowerCase().includes(query);
          
          // Author match - handle both string and array
          let authorMatch = false;
          if (p.authors) {
            if (typeof p.authors === 'string') {
              authorMatch = p.authors.toLowerCase().includes(query);
            } else if (Array.isArray(p.authors)) {
              authorMatch = p.authors.some(author => 
                author.toLowerCase().includes(query)
              );
            }
          }
          
          return titleMatch || abstractMatch || authorMatch;
        } catch (error) {
          console.error('Error filtering paper:', error, p);
          return false;
        }
      });
    }
    
    // Filter by category
    if (category !== 'all') {
      filtered = filtered.filter(p => 
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
      // Filter to last 7 days, then sort by publication date (newest first)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      filtered = filtered
        .filter(p => new Date(p.published) >= oneWeekAgo)
        .sort((a, b) =>
          new Date(b.published).getTime() - new Date(a.published).getTime()
        );
    }
    
    setFilteredPapers(filtered);
  };

  const getCategoryName = (cat) => {
    // Handle special cases
    if (cat === 'all') return 'All Papers';
    if (cat === 'math') return 'Mathematics';
    if (cat === 'physics') return 'Physics';
    
    // Look up in category map
    if (CATEGORY_MAP[cat]) return CATEGORY_MAP[cat];
    
    // Try to find in ALL_CATEGORIES
    for (const [subject, categories] of Object.entries(ALL_CATEGORIES)) {
      const found = categories.find(c => c.id === cat);
      if (found) return found.name;
    }
    
    return cat;
  };

  const getSortName = (sort) => {
    const names = {
      'new': 'Newest Papers (Last 7 Days)',
      'hot': 'Most Upvoted (Last 7 Days)',
      'discussed': 'Most Discussed (Last 7 Days)'
    };
    return names[sort] || 'Most Upvoted (Last 7 Days)';
  };

  if (loading) {
    return (
      <tr>
        <td style={{ padding: '20px', textAlign: 'center', fontFamily: 'Verdana, Geneva, sans-serif', fontSize: '10pt' }}>
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
              <td colSpan={3} style={{ padding: '10px 0', fontSize: '10pt', fontFamily: 'Verdana, Geneva, sans-serif' }}>
                <span style={{ color: '#828282' }}>
                  Showing: <b style={{ color: '#000000' }}>{getSortName(sortBy)}</b>
                  {category !== 'all' && (
                    <>
                      {' in '}
                      <b style={{ color: '#000000' }}>{getCategoryName(category)}</b>
                    </>
                  )}
                  {searchQuery && (
                    <>
                      {' matching '}
                      <b style={{ color: '#000000' }}>"{searchQuery}"</b>
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