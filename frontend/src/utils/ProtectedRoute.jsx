// frontend/src/utils/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode'; // Importation correcte
import { toast } from 'react-toastify';

function ProtectedRoute({ children, allowedRoles }) {
    const token = Cookies.get('token');

    if (!token) {
        toast.error('Vous devez être connecté pour accéder à cette page.');
        return <Navigate to="/auth" replace />;
    }

    try {
        const decodedToken = jwtDecode(token);
        const userRole = decodedToken.role;

        if (allowedRoles && !allowedRoles.includes(userRole)) {
            toast.error('Vous n\'avez pas les autorisations nécessaires pour accéder à cette page.');
            // Vous pourriez rediriger vers un tableau de bord par défaut de leur rôle s'il y en a un
            if (userRole === 'user') return <Navigate to="/user-dashboard" replace />;
            if (userRole === 'commissariat_agent') return <Navigate to="/commissariat-dashboard" replace />;
            if (userRole === 'admin') return <Navigate to="/admin-dashboard" replace />;
            return <Navigate to="/" replace />; // Redirection par défaut si aucun dashboard spécifique
        }

        return children;

    } catch (error) {
        console.error("Erreur de décodage du token ou token invalide:", error);
        Cookies.remove('token');
        toast.error('Votre session a expiré ou le token est invalide. Veuillez vous reconnecter.');
        return <Navigate to="/auth" replace />;
    }
}

export default ProtectedRoute;