import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PaperFeed from './components/PaperFeed';
import PaperDetail from './components/PaperDetail';

function App() {
  const Layout = () => {
    return (
      <center>
        <table
          id="hnmain"
          style={{
            backgroundColor: '#f6f6ef',
            border: '0px',
            borderCollapse: 'collapse',
            borderSpacing: '0px',
            marginLeft: 'auto',
            marginRight: 'auto',
            padding: '0px',
            width: '85%',
          }}
        >
          <tbody>
            <Navbar />
            <tr style={{ height: '10px' }} />
            <Routes>
              <Route path="/" element={<PaperFeed />} />
              <Route path="/paper/:arxivId" element={<PaperDetail />} />
            </Routes>
          </tbody>
        </table>
      </center>
    );
  };

  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
