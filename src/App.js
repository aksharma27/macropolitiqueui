import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Feed from './components/Feed';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main feed on root URL */}
        <Route path="/" element={<Feed />} />
        
        {/* Auth on /login URL */}
        <Route path="/login" element={<Auth />} />
        
        {/* Catch-all redirects back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;