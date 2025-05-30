// frontend/src/pages/UserDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import DeclarationForm from '../components/declaration/DeclarationForm';
import '../styles/UserDashboard.css';

dayjs.locale('fr');

function UserDashboard() {
    const { user } = useAuth();
    const [declarations, setDeclarations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDeclaration, setSelectedDeclaration] = useState(null);
    const [showDeclarationForm, setShowDeclarationForm] = useState(false);

    const fetchUserDeclarations = async () => {
        try {
            setLoading(true);
            const response = await api.get('/declarations/my-declarations');
            setDeclarations(response.data);
            setError(null);
        } catch (err) {
            console.error('Erreur lors du chargement des déclarations:', err);
            const errorMessage = err.response?.data?.message || 'Impossible de charger vos déclarations.';
            setError(errorMessage);
            toast.error(errorMessage);
            
            // Si l'erreur est 401 (non autorisé), rediriger vers la page de connexion
            if (err.response?.status === 401) {
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserDeclarations();
    }, []);

    const openDetailsModal = (declaration) => {
        setSelectedDeclaration(declaration);
    };

    const closeDetailsModal = () => {
        setSelectedDeclaration(null);
    };

    const handleNewDeclaration = () => {
        setShowDeclarationForm(true);
    };

    const handleDeclarationSubmit = async (newDeclaration) => {
        await fetchUserDeclarations();
        setShowDeclarationForm(false);
        toast.success('Déclaration créée avec succès !');
    };

    if (loading) {
        return <div className="dashboard-loading">Chargement de vos déclarations...</div>;
    }

    if (error) {
        return <div className="dashboard-error">Erreur: {error}</div>;
    }

    return (
        <div className="dashboard user-dashboard">
            <div className="dashboard-header">
                <h2>Tableau de Bord</h2>
                <p>Bienvenue, {user?.firstName} ! Voici l'état de vos déclarations.</p>
            </div>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <h3>Total des déclarations</h3>
                    <div className="number">{declarations.length}</div>
                </div>
                <div className="stat-card">
                    <h3>En cours de traitement</h3>
                    <div className="number">
                        {declarations.filter(d => d.status === 'En cours de traitement').length}
                    </div>
                </div>
                <div className="stat-card">
                    <h3>Traitées</h3>
                    <div className="number">
                        {declarations.filter(d => d.status === 'Traitée').length}
                    </div>
                </div>
            </div>

            {!showDeclarationForm ? (
                <button onClick={handleNewDeclaration} className="new-declaration-btn">
                    Nouvelle déclaration
                </button>
            ) : (
                <div className="declaration-form-section">
                    <button onClick={() => setShowDeclarationForm(false)} className="back-btn">
                        Retour au tableau de bord
                    </button>
                    <DeclarationForm onSubmitSuccess={handleDeclarationSubmit} />
                </div>
            )}

            {!showDeclarationForm && (
                <div className="declaration-list-container">
                    <h3>Mes déclarations</h3>
                    {declarations.length === 0 ? (
                        <p>Vous n'avez pas encore de déclarations.</p>
                    ) : (
                        <div className="declaration-cards">
                            {declarations.map((declaration) => (
                                <div key={declaration._id} className="declaration-card">
                                    <h4>Déclaration de {declaration.declarationType === 'objet' ? 'perte d\'objet' : 'disparition de personne'}</h4>
                                    <div className="declaration-info">
                                        <p><strong>N° de déclaration:</strong> {declaration._id}</p>
                                        <p>
                                            <strong>Statut:</strong>{' '}
                                            <span className={`status-badge status-${declaration.status.toLowerCase().replace(/\s/g, '-')}`}>
                                                {declaration.status}
                                            </span>
                                        </p>
                                        <p><strong>Date:</strong> {dayjs(declaration.declarationDate).format('DD MMMM YYYY à HH:mm')}</p>
                                        <p><strong>Lieu:</strong> {declaration.location}</p>
                                        <p><strong>Commissariat:</strong> {declaration.commissariat?.name || 'Non assigné'}</p>
                                    </div>

                                    {declaration.photos && declaration.photos.length > 0 && (
                                        <div className="declaration-photos">
                                            {declaration.photos.map((photo, index) => (
                                                <img 
                                                    key={index} 
                                                    src={`http://localhost:5000/uploads/${photo}`} 
                                                    alt={`Photo ${index + 1}`} 
                                                    className="declaration-photo"
                                                    onClick={() => openDetailsModal(declaration)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {selectedDeclaration && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close-btn" onClick={closeDetailsModal}>&times;</button>
                        <h3>Détails de la Déclaration</h3>
                        <div className="declaration-info">
                            <p><strong>Type:</strong> {selectedDeclaration.declarationType === 'objet' ? 'Perte d\'objet' : 'Disparition de personne'}</p>
                            <p><strong>Statut:</strong> {selectedDeclaration.status}</p>
                            <p><strong>Date:</strong> {dayjs(selectedDeclaration.declarationDate).format('DD MMMM YYYY à HH:mm')}</p>
                            <p><strong>Lieu:</strong> {selectedDeclaration.location}</p>
                            <p><strong>Description:</strong> {selectedDeclaration.description}</p>
                            <p><strong>Commissariat:</strong> {selectedDeclaration.commissariat?.name || 'Non assigné'}</p>
                        </div>

                        {selectedDeclaration.photos && selectedDeclaration.photos.length > 0 && (
                            <div className="photos-section">
                                <h4>Photos</h4>
                                <div className="photo-grid">
                                    {selectedDeclaration.photos.map((photo, index) => (
                                        <img 
                                            key={index} 
                                            src={`http://localhost:5000/uploads/${photo}`} 
                                            alt={`Photo ${index + 1}`} 
                                            className="declaration-photo"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserDashboard;