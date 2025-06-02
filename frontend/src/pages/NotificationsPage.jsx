import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import '../styles/Notifications.css';
dayjs.locale('fr');

function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                if (!user || !user.commissariat) {
                    console.log('User ou commissariat non disponible:', { user });
                    throw new Error('Informations de commissariat non disponibles');
                }

                const commissariatId = typeof user.commissariat === 'object' 
                    ? user.commissariat._id 
                    : user.commissariat;

                console.log('Fetching notifications for commissariat:', commissariatId);
                const response = await api.get(`/declarations/commissariat/${commissariatId}`);
                console.log('Réponse complète des déclarations:', response.data);
                
                // Filtrer les déclarations avec le statut "En attente"
                const newDeclarations = response.data.filter(decl => {
                    console.log('Vérification déclaration:', {
                        id: decl._id,
                        status: decl.status,
                        date: decl.declarationDate
                    });
                    return decl.status === 'En attente';
                });
                console.log('Déclarations filtrées:', newDeclarations);
                setNotifications(newDeclarations);
            } catch (error) {
                console.error('Erreur détaillée lors du chargement des notifications:', error);
                console.error('Response data:', error.response?.data);
                console.error('Response status:', error.response?.status);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [user]);

    if (loading) {
        return <div className="loading">Chargement des notifications...</div>;
    }

    return (
        <div className="notifications-page">
            <h2>Nouvelles Déclarations</h2>
            <div className="notifications-list">
                {notifications.length === 0 ? (
                    <p>Aucune nouvelle déclaration</p>
                ) : (
                    notifications.map((notification) => (
                        <div key={notification._id} className="notification-card">
                            <div className="notification-header">
                                <h3>Nouvelle déclaration #{notification.receiptNumber || notification._id}</h3>
                                <span className="notification-date">
                                    {dayjs(notification.declarationDate).format('DD MMMM YYYY à HH:mm')}
                                </span>
                            </div>
                            <div className="notification-content">
                                <p><strong>Type:</strong> {notification.declarationType === 'objet' ? 'Perte d\'objet' : 'Disparition de personne'}</p>
                                <p><strong>Déclarant:</strong> {notification.user ? `${notification.user.firstName} ${notification.user.lastName}` : 'Inconnu'}</p>
                                <p><strong>Lieu:</strong> {notification.location}</p>
                                <p><strong>Description:</strong> {notification.description}</p>
                                <p><strong>Statut:</strong> <span className={`status-${notification.status.toLowerCase().replace(/\s/g, '-')}`}>{notification.status}</span></p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default NotificationsPage; 