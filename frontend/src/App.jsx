import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PaperFeed from './components/PaperFeed';
import PaperDetail from './components/PaperDetail';
import Login from './components/Login';
import Register from './components/Register';
import UserProfile from './components/UserProfile';

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
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/user/:username" element={<UserProfile />} />
            </Routes>
            <Footer />
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
