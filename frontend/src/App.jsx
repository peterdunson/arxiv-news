import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PaperFeed from './components/PaperFeed';
import PaperDetail from './components/PaperDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PaperFeed />} />
        <Route path="/paper/:arxivId" element={<PaperDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
