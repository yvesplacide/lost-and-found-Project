import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

function NotificationCounter() {
    const [count, setCount] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        const fetchNotificationCount = async () => {
            try {
                if (!user || !user.commissariat) {
                    console.log('User ou commissariat non disponible:', { user });
                    return;
                }

                const commissariatId = typeof user.commissariat === 'object' 
                    ? user.commissariat._id 
                    : user.commissariat;

                console.log('Fetching notifications for commissariat:', commissariatId);
                const response = await api.get(`/declarations/commissariat/${commissariatId}`);
                console.log('Réponse complète des déclarations:', response.data);
                
                // Compter les déclarations avec le statut "En attente"
                const newDeclarationsCount = response.data.filter(decl => decl.status === 'En attente').length;
                console.log('Nombre de déclarations en attente:', newDeclarationsCount);
                setCount(newDeclarationsCount);
            } catch (error) {
                console.error('Erreur détaillée lors du chargement du nombre de notifications:', error);
                console.error('Response data:', error.response?.data);
                console.error('Response status:', error.response?.status);
            }
        };

        fetchNotificationCount();
        // Mettre à jour le compteur toutes les 30 secondes
        const interval = setInterval(fetchNotificationCount, 30000);

        return () => clearInterval(interval);
    }, [user]);

    return (
        <div className="notification-counter">
            {count}
        </div>
    );
}

export default NotificationCounter; 