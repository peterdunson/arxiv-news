import { Link, useSearchParams } from 'react-router-dom';

export default function Navbar() {
  const [searchParams] = useSearchParams();
  const currentSort = searchParams.get('sort') || 'hot';
  const currentCat = searchParams.get('cat') || 'all';

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
                  <Link to={`/?sort=${currentSort}&cat=quant-ph`} style={{ color: '#ffffff' }}>quantum</Link>
                </span>
              </td>
              <td style={{ textAlign: 'right', padding: '0px', paddingRight: '4px' }}>
                <span className="pagetop">
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
