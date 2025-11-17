import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Lazy load de las rutas para code splitting
const AvatarView = lazy(() => import('./pages/AvatarView'));
const ControlPanel = lazy(() => import('./pages/ControlPanel'));

// Loading fallback optimizado
const LoadingFallback = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    color: 'white'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid rgba(255,255,255,0.3)',
        borderTop: '4px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px'
      }} />
      <p>Cargando...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<AvatarView />} />
          <Route path="/control" element={<ControlPanel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
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
