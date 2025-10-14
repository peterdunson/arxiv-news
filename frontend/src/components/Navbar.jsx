import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <tr>
      <td style={{ backgroundColor: '#ff6600', padding: '0px' }}>
        <table style={{ border: '0px', padding: '2px', borderSpacing: '0px', width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ width: '18px', padding: '0px', paddingRight: '4px' }}>
                <Link to="/">
                  <img
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18'%3E%3Crect fill='white' x='0' y='0' width='18' height='18'/%3E%3Ctext x='9' y='14' font-size='16' text-anchor='middle' fill='%23ff6600'%3EA%3C/text%3E%3C/svg%3E"
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
                    <Link to="/" style={{ color: '#000000' }}>arXiv News</Link>
                  </b>
                  <Link to="/?cat=all" style={{ color: '#000000' }}>all</Link> |{' '}
                  <Link to="/?cat=cs.AI" style={{ color: '#000000' }}>ai</Link> |{' '}
                  <Link to="/?cat=cs.LG" style={{ color: '#000000' }}>ml</Link> |{' '}
                  <Link to="/?cat=cs.CL" style={{ color: '#000000' }}>nlp</Link> |{' '}
                  <Link to="/?cat=cs.CV" style={{ color: '#000000' }}>vision</Link> |{' '}
                  <Link to="/?cat=cs.RO" style={{ color: '#000000' }}>robotics</Link> |{' '}
                  <Link to="/?cat=stat.ML" style={{ color: '#000000' }}>stats</Link> |{' '}
                  <Link to="/?cat=math" style={{ color: '#000000' }}>math</Link> |{' '}
                  <Link to="/?cat=physics" style={{ color: '#000000' }}>physics</Link> |{' '}
                  <Link to="/?cat=quant-ph" style={{ color: '#000000' }}>quantum</Link>
                </span>
              </td>
              <td style={{ textAlign: 'right', padding: '0px', paddingRight: '4px' }}>
                <span className="pagetop">
                  <Link to="/login" style={{ color: '#000000' }}>login</Link>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}
