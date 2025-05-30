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
    navigate('/auth'); // Redirige vers la page de connexion après déconnexion
    toast.info('Vous avez été déconnecté avec succès.');
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
      <nav>
        {user ? (
          <>
            {/* Liens spécifiques au rôle */}
            {user.role === 'user' && (
              <>
                <Link to="/user-dashboard">Mon Tableau de Bord</Link>
                <Link to="/declaration/new" className="new-declaration-link">Nouvelle déclaration</Link>
              </>
            )}
            {user.role === 'commissariat_agent' && (
              <Link to="/commissariat-dashboard">Gérer les Déclarations</Link>
            )}
            {user.role === 'admin' && (
              <Link to="/admin-dashboard">Administration</Link>
            )}

            {/* Informations utilisateur et bouton de déconnexion */}
            <span className="user-info">Bienvenue, {user.firstName} ({user.role})</span>
            <button onClick={handleLogout} className="btn text-btn header-logout-btn">Déconnexion</button>
          </>
        ) : (
          // Liens lorsque l'utilisateur n'est pas connecté
          <Link to="/auth">Connexion / Inscription</Link>
        )}
      </nav>
    </header>
  );
}

export default Header;