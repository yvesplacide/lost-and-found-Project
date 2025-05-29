// frontend/src/components/common/Header.js
import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <nav>
        <Link to="/">Accueil</Link>
        <Link to="/auth">Connexion/Inscription</Link>
        {/* Ajouter les liens de tableau de bord ici plus tard, basés sur le rôle */}
      </nav>
    </header>
  );
}

export default Header;