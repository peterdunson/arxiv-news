export default function Footer() {
  return (
    <tr>
      <td style={{ padding: '10px 0px', textAlign: 'center' }}>
        <span style={{ fontSize: '9pt', color: '#828282', fontFamily: 'Verdana' }}>
          Created by Peter Dunson, 2025 |{' '}
          <a
            href="https://github.com/peterdunson"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#828282', textDecoration: 'underline' }}
          >
            GitHub
          </a>
        </span>
      </td>
    </tr>
  );
}
