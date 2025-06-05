import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

function NotificationCounter() {
    const [count, setCount] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        const fetchNotificationCount = async () => {
            try {
                if (!user) {
                    return;
                }

                // Vérifier si l'utilisateur est un agent de commissariat
                if (user.role !== 'commissariat_agent') {
                    return;
                }

                // Récupérer l'ID du commissariat
                let commissariatId;
                if (user.commissariat) {
                    commissariatId = typeof user.commissariat === 'object' 
                        ? user.commissariat._id 
                        : user.commissariat;
                } else {
                    // Si le commissariat n'est pas dans l'objet user, essayer de le récupérer
                    const userResponse = await api.get('/auth/me');
                    if (userResponse.data.commissariat) {
                        commissariatId = typeof userResponse.data.commissariat === 'object' 
                            ? userResponse.data.commissariat._id 
                            : userResponse.data.commissariat;
                    } else {
                        return;
                    }
                }

                if (!commissariatId) {
                    return;
                }

                const response = await api.get(`/declarations/commissariat/${commissariatId}`);
                const newDeclarationsCount = response.data.filter(decl => decl.status === 'En attente').length;
                setCount(newDeclarationsCount);
            } catch (error) {
                console.error('Erreur lors du chargement du nombre de notifications:', error);
            }
        };

        fetchNotificationCount();
        const interval = setInterval(fetchNotificationCount, 30000);

        return () => clearInterval(interval);
    }, [user]);

    // Ne pas afficher le compteur si l'utilisateur n'est pas un agent de commissariat
    if (!user || user.role !== 'commissariat_agent') {
        return null;
    }

    return count > 0 ? (
        <div className="notification-counter">
            {count}
        </div>
    ) : null;
}

export default NotificationCounter; 