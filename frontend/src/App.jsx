// frontend/src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importez vos composants de mise en page et de pages
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import UserDashboard from './pages/UserDashboard';
import CommissariatDashboard from './pages/CommissariatDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFoundPage from './pages/NotFoundPage';
import NewDeclarationPage from './pages/NewDeclarationPage';

// Importez le composant pour la protection des routes
import ProtectedRoute from './utils/ProtectedRoute';

import './index.css'; // Pour les styles globaux (ou App.css si vous en créez un)

function App() {
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Routes Protégées pour les Utilisateurs */}
          <Route path="/user-dashboard" element={<ProtectedRoute allowedRoles={['user']}><UserDashboard /></ProtectedRoute>} />
          <Route path="/declaration/new" element={<ProtectedRoute allowedRoles={['user']}><NewDeclarationPage /></ProtectedRoute>} />
          {/* Ajoutez d'autres routes spécifiques à l'utilisateur ici */}

          {/* Routes Protégées pour les Agents de Commissariat */}
          <Route path="/commissariat-dashboard" element={<ProtectedRoute allowedRoles={['commissariat_agent']}><CommissariatDashboard /></ProtectedRoute>} />
          {/* Ajoutez d'autres routes spécifiques au commissariat ici */}

          {/* Routes Protégées pour les Administrateurs */}
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          {/* Ajoutez d'autres routes spécifiques à l'admin ici */}

          {/* Route 404 - Toujours en dernier */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;