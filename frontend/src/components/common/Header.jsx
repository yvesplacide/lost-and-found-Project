// frontend/src/components/common/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import '../../styles/Header.css';

function Header() {
  const { user, logout, loading } = useAuth(); // Récupère l'utilisateur, logout, et loading du contexte
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
    toast.info('Déconnexion réussie');
  };

  // Si le chargement est en cours, on ne rend rien ou un indicateur de chargement
  if (loading) {
    return null; // Ou <header><div>Chargement...</div></header>
  }

  return (
    <header className="header">
      <div className="logo">
        {/* Vous pouvez remplacer ceci par une image de logo si vous en avez une */}
        <Link to="/">Déclaration de Perte</Link>
      </div>
      <nav className="header-nav-flex">
        {user ? (
          <>
            {/* Liens spécifiques au rôle */}
            {user.role === 'user' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', gap: '1rem' }}>
                <Link to="/user-dashboard">Mon Tableau de Bord</Link>
                <Link to="/declaration/new" className="new-declaration-link">Nouvelle déclaration</Link>
                <span className="user-info">Bienvenue, {user.firstName} ({user.role})</span>
                <button onClick={handleLogout} className="btn text-btn header-logout-btn">Déconnexion</button>
              </div>
            )}
            {user.role === 'commissariat_agent' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', gap: '1rem' }}>
                <Link to="/commissariat-dashboard">Gérer les Déclarations</Link>
                <span className="user-info">Bienvenue, {user.firstName} ({user.role})</span>
                <button onClick={handleLogout} className="btn text-btn header-logout-btn">Déconnexion</button>
              </div>
            )}
            {user.role === 'admin' && (
              <Link to="/admin-dashboard">Administration</Link>
            )}

            {/* Informations utilisateur et bouton de déconnexion pour les autres rôles */}
            {user.role !== 'commissariat_agent' && user.role !== 'user' && (
              <>
                <span className="user-info">Bienvenue, {user.firstName} ({user.role})</span>
                <button onClick={handleLogout} className="btn text-btn header-logout-btn">Déconnexion</button>
              </>
            )}
          </>
        ) : (
          // Liens lorsque l'utilisateur n'est pas connecté
          <div style={{ display: 'flex', width: '100%' }}>
            <div style={{ flexGrow: 1 }}></div>
            <Link to="/auth">Connexion / Inscription</Link>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;