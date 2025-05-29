// frontend/src/components/common/Footer.js
import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} Déclaration de Perte. Tous droits réservés.</p>
    </footer>
  );
}

export default Footer;