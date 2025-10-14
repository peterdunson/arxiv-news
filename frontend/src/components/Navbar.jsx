import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ALL_CATEGORIES } from '../utils/categories';

export default function Navbar() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentSort = searchParams.get('sort') || 'hot';
  const currentCat = searchParams.get('cat') || 'all';
  const currentSearch = searchParams.get('q') || '';
  
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Update search input when URL changes
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      params.set('q', searchInput.trim());
    } else {
      params.delete('q');
    }
    navigate(`/?${params.toString()}`);
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    setSearchInput('');
    navigate(`/?${params.toString()}`);
  };

  const handleCategoryClick = (categoryId) => {
    const params = new URLSearchParams(searchParams);
    params.set('cat', categoryId);
    navigate(`/?${params.toString()}`);
    setShowDropdown(false);
  };

  return (
    <tr>
      <td style={{ backgroundColor: '#d64545', padding: '0px' }}>
        <table style={{ border: '0px', padding: '2px', borderSpacing: '0px', width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ width: '18px', padding: '0px', paddingRight: '4px' }}>
                <Link to="/">
                  <img
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18'%3E%3Crect fill='white' x='0' y='0' width='18' height='18'/%3E%3Ctext x='9' y='14' font-size='16' text-anchor='middle' fill='%23b31b1b'%3EA%3C/text%3E%3C/svg%3E"
                    alt="arXiv"
                    style={{
                      border: '1px',
                      borderColor: 'white',
                      borderStyle: 'solid',
                      height: '18px',
                      width: '18px',
                    }}
                  />
                </Link>
              </td>
              <td style={{ lineHeight: '12px', height: '10px', padding: '0px' }}>
                <span className="pagetop">
                  <b className="hnname">
                    <Link to="/" style={{ color: '#ffffff' }}>arXiv News</Link>
                  </b>
                  {' | '}
                  <Link to={`/?sort=new&cat=${currentCat}`} style={{ color: '#ffffff' }}>new</Link> |{' '}
                  <Link to={`/?sort=hot&cat=${currentCat}`} style={{ color: '#ffffff' }}>hot</Link> |{' '}
                  <Link to={`/?sort=discussed&cat=${currentCat}`} style={{ color: '#ffffff' }}>discussed</Link> |{' '}
                  <Link to={`/?sort=${currentSort}&cat=all`} style={{ color: '#ffffff' }}>all</Link> |{' '}
                  <Link to={`/?sort=${currentSort}&cat=cs.AI`} style={{ color: '#ffffff' }}>ai</Link> |{' '}
                  <Link to={`/?sort=${currentSort}&cat=cs.LG`} style={{ color: '#ffffff' }}>ml</Link> |{' '}
                  <Link to={`/?sort=${currentSort}&cat=cs.CL`} style={{ color: '#ffffff' }}>nlp</Link> |{' '}
                  <Link to={`/?sort=${currentSort}&cat=cs.CV`} style={{ color: '#ffffff' }}>vision</Link> |{' '}
                  <Link to={`/?sort=${currentSort}&cat=cs.RO`} style={{ color: '#ffffff' }}>robotics</Link> |{' '}
                  <Link to={`/?sort=${currentSort}&cat=stat.ML`} style={{ color: '#ffffff' }}>stats</Link> |{' '}
                  <Link to={`/?sort=${currentSort}&cat=math`} style={{ color: '#ffffff' }}>math</Link> |{' '}
                  <Link to={`/?sort=${currentSort}&cat=physics`} style={{ color: '#ffffff' }}>physics</Link> |{' '}
                  <Link to={`/?sort=${currentSort}&cat=quant-ph`} style={{ color: '#ffffff' }}>quantum</Link> |{' '}
                  <span 
                    ref={dropdownRef}
                    style={{ position: 'relative', display: 'inline-block' }}
                  >
                    <a 
                      onClick={() => setShowDropdown(!showDropdown)}
                      style={{ color: '#ffffff', cursor: 'pointer', userSelect: 'none' }}
                    >
                      more ▾
                    </a>
                    {showDropdown && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: '0',
                          marginTop: '4px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #d64545',
                          borderRadius: '4px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          zIndex: 1000,
                          minWidth: '250px',
                          maxHeight: '500px',
                          overflowY: 'auto',
                          padding: '8px 0',
                        }}
                      >
                        {Object.entries(ALL_CATEGORIES).map(([subject, categories]) => (
                          <div key={subject} style={{ marginBottom: '8px' }}>
                            <div
                              style={{
                                padding: '4px 12px',
                                fontSize: '9pt',
                                fontWeight: 'bold',
                                color: '#d64545',
                                borderBottom: '1px solid #f0f0f0',
                                fontFamily: 'Verdana',
                              }}
                            >
                              {subject}
                            </div>
                            {categories.map((cat) => (
                              <a
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.id)}
                                style={{
                                  display: 'block',
                                  padding: '4px 12px 4px 20px',
                                  fontSize: '9pt',
                                  color: currentCat === cat.id ? '#d64545' : '#000000',
                                  cursor: 'pointer',
                                  fontFamily: 'Verdana',
                                  backgroundColor: currentCat === cat.id ? '#f8f8f8' : 'transparent',
                                  textDecoration: 'none',
                                }}
                                onMouseEnter={(e) => {
                                  if (currentCat !== cat.id) {
                                    e.target.style.backgroundColor = '#f8f8f8';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (currentCat !== cat.id) {
                                    e.target.style.backgroundColor = 'transparent';
                                  }
                                }}
                              >
                                {cat.name}
                              </a>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </span>
                </span>
              </td>
              <td style={{ textAlign: 'right', padding: '0px', paddingRight: '4px' }}>
                <span className="pagetop">
                  <form onSubmit={handleSearch} style={{ display: 'inline', marginRight: '10px' }}>
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="search"
                      style={{
                        width: '120px',
                        padding: '2px 4px',
                        fontSize: '10pt',
                        fontFamily: 'Verdana',
                        border: '1px solid white',
                        backgroundColor: 'white',
                        color: '#000000'
                      }}
                    />
                    {currentSearch && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        style={{
                          marginLeft: '4px',
                          padding: '2px 6px',
                          fontSize: '9pt',
                          fontFamily: 'Verdana',
                          border: '1px solid white',
                          backgroundColor: 'white',
                          color: '#d64545',
                          cursor: 'pointer'
                        }}
                      >
                        clear
                      </button>
                    )}
                  </form>
                  <Link to="/login" style={{ color: '#ffffff' }}>login</Link>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}
