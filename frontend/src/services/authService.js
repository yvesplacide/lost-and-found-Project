// frontend/src/services/authService.js
import api from './api'; // Notre instance Axios configurée
import Cookies from 'js-cookie'; // Pour stocker le token JWT

const register = async (userData) => {
    try {
        const response = await api.post('/auth/register', userData);
        if (response.data.token) {
            // Créer une date d'expiration à 1 heure dans le futur
            const expirationDate = new Date(new Date().getTime() + 3600000);
            Cookies.set('token', response.data.token, { expires: expirationDate });
            // Optionnel: Stocker les infos utilisateur aussi si nécessaire, mais le token contient déjà le rôle
            // localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

const login = async (userData) => {
    try {
        const response = await api.post('/auth/login', userData);
        if (response.data.token) {
            // Créer une date d'expiration à 1 heure dans le futur
            const expirationDate = new Date(new Date().getTime() + 3600000);
            Cookies.set('token', response.data.token, { expires: expirationDate });
            // Optionnel: Stocker les infos utilisateur
            // localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

const logout = () => {
    // Supprimer le token des cookies
    Cookies.remove('token');
    
    // Supprimer toutes les données du localStorage
    localStorage.clear();
    
    // Supprimer toutes les données du sessionStorage
    sessionStorage.clear();
    
    // Supprimer les données du cache du navigateur
    if ('caches' in window) {
        caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
                caches.delete(cacheName);
            });
        });
    }

    // Réinitialiser tous les formulaires de la page
    const forms = document.getElementsByTagName('form');
    for (let form of forms) {
        form.reset();
    }

    // Réinitialiser tous les champs input, textarea et select
    const inputs = document.getElementsByTagName('input');
    const textareas = document.getElementsByTagName('textarea');
    const selects = document.getElementsByTagName('select');

    for (let input of inputs) {
        input.value = '';
    }
    for (let textarea of textareas) {
        textarea.value = '';
    }
    for (let select of selects) {
        select.selectedIndex = 0;
    }
};

// Fonction pour obtenir l'utilisateur courant basé sur le token (utile pour rafraîchir la page)
const getMe = async () => {
    try {
        const response = await api.get('/auth/me');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};


const authService = {
    register,
    login,
    logout,
    getMe,
};

export default authService;