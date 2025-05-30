// frontend/src/pages/CommissariatDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import 'dayjs/locale/fr'; // Importer la locale française pour dayjs
import '../styles/CommissariatDashboard.css'; // Import du CSS
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaList, FaChartBar, FaCog, FaBell } from 'react-icons/fa';
dayjs.locale('fr');

function CommissariatDashboard() {
    const { user } = useAuth(); // L'agent connecté a accès à son commissariatId via user.commissariat._id
    const [declarations, setDeclarations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDeclaration, setSelectedDeclaration] = useState(null); // Pour la modal de détails/édition
    const location = useLocation();

    const statusOptions = [
        'En attente',
        'En cours de traitement',
        'Traitée',
        'Clôturée'
    ];

    const fetchCommissariatDeclarations = async () => {
        if (!user || !user.commissariat) {
            setError('Informations de commissariat non disponibles pour cet agent.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            // Utiliser directement l'ID du commissariat de l'agent
            const response = await api.get(`/declarations/commissariat/${user.commissariat}`);
            setDeclarations(response.data);
            setError(null);
        } catch (err) {
            console.error('Erreur lors du chargement des déclarations du commissariat:', err);
            setError(err.response?.data?.message || 'Impossible de charger les déclarations du commissariat.');
            toast.error(err.response?.data?.message || 'Erreur lors du chargement des déclarations.');
        } finally {
            setLoading(false);
        }
    };

    // Charger les déclarations au montage du composant ou si l'utilisateur change
    useEffect(() => {
        if (user && user.commissariat) {
            fetchCommissariatDeclarations();
        }
    }, [user]);

    const handleStatusChange = async (declarationId, newStatus) => {
        try {
            const response = await api.put(`/declarations/${declarationId}/status`, { status: newStatus });
            setDeclarations(prevDeclarations =>
                prevDeclarations.map(decl =>
                    decl._id === declarationId ? { ...decl, status: response.data.status } : decl
                )
            );
            toast.success(`Statut de la déclaration ${response.data.receiptNumber} mis à jour : ${response.data.status}`);
        } catch (err) {
            console.error('Erreur lors de la mise à jour du statut:', err);
            toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour du statut.');
        }
    };

    const openDetailsModal = (declaration) => {
        setSelectedDeclaration(declaration);
    };

    const closeDetailsModal = () => {
        setSelectedDeclaration(null);
    };

    if (loading) {
        return <div className="dashboard-loading">Chargement des déclarations du commissariat...</div>;
    }

    if (error) {
        return <div className="dashboard-error">Erreur: {error}</div>;
    }

    return (
        <div className="dashboard commissariat-dashboard">
            {/* Sidebar */}
            <aside className="sidebar">
                <nav>
                    <ul className="sidebar-menu">
                        <li>
                            <Link to="/commissariat-dashboard" className={location.pathname === '/commissariat-dashboard' ? 'active' : ''}>
                                <FaHome /> Tableau de bord
                            </Link>
                        </li>
                        <li>
                            <Link to="/commissariat-dashboard/declarations" className={location.pathname === '/commissariat-dashboard/declarations' ? 'active' : ''}>
                                <FaList /> Déclarations
                            </Link>
                        </li>
                        <li>
                            <Link to="/commissariat-dashboard/statistics" className={location.pathname === '/commissariat-dashboard/statistics' ? 'active' : ''}>
                                <FaChartBar /> Statistiques
                            </Link>
                        </li>
                        <li>
                            <Link to="/commissariat-dashboard/notifications" className={location.pathname === '/commissariat-dashboard/notifications' ? 'active' : ''}>
                                <FaBell /> Notifications
                            </Link>
                        </li>
                        <li>
                            <Link to="/commissariat-dashboard/settings" className={location.pathname === '/commissariat-dashboard/settings' ? 'active' : ''}>
                                <FaCog /> Paramètres
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Contenu principal */}
            <main className="dashboard-content">
                <h2>Tableau de Bord du Commissariat</h2>
                {user && user.commissariat && (
                    <p>Bienvenue, {user.firstName} ! Vous gérez les déclarations du commissariat de **{user.commissariat.name}** ({user.commissariat.city}).</p>
                )}

                <div className="declaration-list-container">
                    <h3>Déclarations à Gérer</h3>
                    {declarations.length === 0 ? (
                        <p>Aucune déclaration à gérer pour votre commissariat pour l'instant.</p>
                    ) : (
                        <div className="declaration-cards">
                            {declarations.map((declaration) => (
                                <div key={declaration._id} className="declaration-card">
                                    <div className="declaration-info">
                                        <h4>Déclaration de {declaration.declarationType === 'objet' ? 'perte d\'objet' : 'disparition de personne'}</h4>
                                        <p><strong>N° de déclaration:</strong> {declaration._id}</p>
                                        <p><strong>Statut:</strong> <span className={`status-${declaration.status.toLowerCase().replace(/\s/g, '-')}`}>{declaration.status}</span></p>
                                        <p><strong>Déclarant:</strong> {declaration.user ? `${declaration.user.firstName} ${declaration.user.lastName}` : 'Inconnu'}</p>
                                        <p><strong>Date:</strong> {dayjs(declaration.declarationDate).format('DD MMMM YYYY à HH:mm')}</p>
                                        <p><strong>Lieu:</strong> {declaration.location}</p>

                                        <div className="form-group">
                                            <label htmlFor={`status-${declaration._id}`}>Changer le statut:</label>
                                            <select
                                                id={`status-${declaration._id}`}
                                                value={declaration.status}
                                                onChange={(e) => handleStatusChange(declaration._id, e.target.value)}
                                                className="status-select"
                                            >
                                                {statusOptions.map(status => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button onClick={() => openDetailsModal(declaration)} className="btn primary-btn btn-sm">Voir les détails</button>
                                    </div>

                                    {declaration.photos && declaration.photos.length > 0 && (
                                        <div className="declaration-photos">
                                            {declaration.photos.map((photo, index) => (
                                                <img 
                                                    key={index} 
                                                    src={`http://localhost:5000/uploads/${photo}`} 
                                                    alt={`Photo ${index + 1}`} 
                                                    className="declaration-photo-thumbnail"
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

                {/* Modal pour afficher les détails complets de la déclaration sélectionnée */}
                {selectedDeclaration && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <button className="modal-close-btn" onClick={closeDetailsModal}>&times;</button>
                            <h3>Détails de la Déclaration : {selectedDeclaration.receiptNumber || 'N/A'}</h3>
                            <p><strong>Type:</strong> {selectedDeclaration.declarationType === 'objet' ? 'Perte d\'objet' : 'Disparition de personne'}</p>
                            <p><strong>Statut:</strong> {selectedDeclaration.status}</p>
                            <p><strong>Déclarant:</strong> {selectedDeclaration.declarant ? `${selectedDeclaration.declarant.firstName} ${selectedDeclaration.declarant.lastName} (${selectedDeclaration.declarant.email})` : 'Inconnu'}</p>
                            <p><strong>Date:</strong> {dayjs(selectedDeclaration.declarationDate).format('DD MMMM YYYY à HH:mm')}</p>
                            <p><strong>Lieu:</strong> {selectedDeclaration.location}</p>
                            <p><strong>Description:</strong> {selectedDeclaration.description}</p>

                            {selectedDeclaration.declarationType === 'objet' && selectedDeclaration.objectDetails && (
                                <div className="details-section">
                                    <h5>Détails de l'objet:</h5>
                                    <p>Nom: {selectedDeclaration.objectDetails.objectName}</p>
                                    <p>Catégorie: {selectedDeclaration.objectDetails.objectCategory}</p>
                                    {selectedDeclaration.objectDetails.objectBrand && <p>Marque: {selectedDeclaration.objectDetails.objectBrand}</p>}
                                    {selectedDeclaration.objectDetails.color && <p>Couleur: {selectedDeclaration.objectDetails.color}</p>}
                                </div>
                            )}

                            {selectedDeclaration.declarationType === 'personne' && selectedDeclaration.personDetails && (
                                <div className="details-section">
                                    <h5>Détails de la personne:</h5>
                                    <p>Nom: {selectedDeclaration.personDetails.lastName}, Prénom: {selectedDeclaration.personDetails.firstName}</p>
                                    <p>Date de naissance: {dayjs(selectedDeclaration.personDetails.dateOfBirth).format('DD MMMM YYYY')}</p>
                                    {selectedDeclaration.personDetails.lastSeenLocation && <p>Dernier lieu vu: {selectedDeclaration.personDetails.lastSeenLocation}</p>}
                                </div>
                            )}

                            {selectedDeclaration.commissariat && (
                                <div className="details-section">
                                    <h5>Commissariat assigné:</h5>
                                    <p>{selectedDeclaration.commissariat.name} ({selectedDeclaration.commissariat.city})</p>
                                    <p>Email: {selectedDeclaration.commissariat.email}</p>
                                    <p>Téléphone: {selectedDeclaration.commissariat.phone}</p>
                                </div>
                            )}

                            {selectedDeclaration.photos && selectedDeclaration.photos.length > 0 && (
                                <div className="photos-section">
                                    <h5>Photos:</h5>
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
            </main>
        </div>
    );
}

export default CommissariatDashboard;