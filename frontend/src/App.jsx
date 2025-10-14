import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Leftbar from './components/Leftbar';
import Rightbar from './components/Rightbar';
import PaperFeed from './components/PaperFeed';
import PaperDetail from './components/PaperDetail';

function App() {
  const Layout = () => {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="flex max-w-[1400px] mx-auto">
          <div className="w-[280px]">
            <Leftbar />
          </div>
          <div className="flex-1 p-4">
            <Routes>
              <Route path="/" element={<PaperFeed />} />
              <Route path="/paper/:arxivId" element={<PaperDetail />} />
            </Routes>
          </div>
          <div className="w-[300px]">
            <Rightbar />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
