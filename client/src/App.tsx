import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AvatarView from './pages/AvatarView';
import ControlPanel from './pages/ControlPanel';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AvatarView />} />
        <Route path="/control" element={<ControlPanel />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1a1a1a',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '72px', margin: '0' }}>404</h1>
      <p style={{ fontSize: '24px', marginBottom: '30px' }}>Página no encontrada</p>
      <div style={{ display: 'flex', gap: '20px' }}>
        <Link 
          to="/" 
          style={{
            padding: '15px 30px',
            backgroundColor: '#667eea',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            transition: 'background-color 0.3s'
          }}
        >
          🎭 Vista del Avatar
        </Link>
        <Link 
          to="/control" 
          style={{
            padding: '15px 30px',
            backgroundColor: '#764ba2',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            transition: 'background-color 0.3s'
          }}
        >
          🎮 Panel de Control
        </Link>
      </div>
    </div>
  );
}

export default App;
