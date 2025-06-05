// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import authService from '../services/authService'; // Notre service d'authentification

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Contient l'objet utilisateur (id, nom, rôle, etc.)
    const [loading, setLoading] = useState(true); // Pour indiquer si la vérification de l'auth est en cours

    // Fonction pour charger l'utilisateur à partir du token au démarrage de l'application
    const loadUser = async () => {
        const token = Cookies.get('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Vérifiez si le token est expiré avant de tenter de l'utiliser
                if (decoded.exp * 1000 < Date.now()) {
                    // Token expiré
                    logout(); // Déconnecte l'utilisateur
                    toast.info('Votre session a expiré. Veuillez vous reconnecter.');
                    setLoading(false);
                    return;
                }
                // Si le token est valide et non expiré, récupère les infos utilisateur complètes
                const userData = await authService.getMe();
                setUser(userData);
            } catch (error) {
                console.error("Failed to decode token or fetch user:", error);
                logout(); // Supprime le token invalide
                toast.error('Token invalide. Veuillez vous reconnecter.');
            }
        }
        setLoading(false); // La vérification est terminée
    };

    useEffect(() => {
        loadUser();
    }, []); // S'exécute une seule fois au montage du composant

    const login = async (email, password) => {
        try {
            setLoading(true);
            const data = await authService.login({ email, password });
            setUser(data);
            setLoading(false);
            return data;
        } catch (error) {
            setLoading(false);
            toast.error(error);
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            setLoading(true);
            const data = await authService.register(userData);
            setUser(data);
            setLoading(false);
            return data;
        } catch (error) {
            setLoading(false);
            toast.error(error);
            throw error;
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personnalisé pour utiliser le contexte d'authentification plus facilement
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};