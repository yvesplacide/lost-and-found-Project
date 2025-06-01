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
        if (!user) {
            console.log('User not available');
            setError('Informations de commissariat non disponibles pour cet agent.');
            setLoading(false);
            return;
        }

        console.log('User data:', user);
        console.log('User role:', user.role);
        console.log('User commissariat:', user.commissariat);
        console.log('User commissariat type:', typeof user.commissariat);

        try {
            setLoading(true);
            
            // Vérifier si l'utilisateur est un agent de commissariat
            if (user.role !== 'commissariat_agent') {
                throw new Error('Accès non autorisé. Vous devez être un agent de commissariat.');
            }

            // Récupérer l'ID du commissariat
            let commissariatId;
            if (user.commissariat) {
                if (typeof user.commissariat === 'object' && user.commissariat !== null) {
                    commissariatId = user.commissariat._id;
                } else if (typeof user.commissariat === 'string') {
                    commissariatId = user.commissariat;
                } else {
                    console.error('Format de commissariat invalide:', user.commissariat);
                    throw new Error('Format de données du commissariat invalide');
                }
            } else {
                // Si le commissariat n'est pas défini, essayer de récupérer les informations de l'utilisateur
                try {
                    const userResponse = await api.get('/auth/me');
                    console.log('User data from /auth/me:', userResponse.data);
                    if (userResponse.data.commissariat) {
                        commissariatId = typeof userResponse.data.commissariat === 'object' 
                            ? userResponse.data.commissariat._id 
                            : userResponse.data.commissariat;
                    } else {
                        throw new Error('Commissariat non assigné à cet agent');
                    }
                } catch (userError) {
                    console.error('Erreur lors de la récupération des données utilisateur:', userError);
                    throw new Error('Impossible de récupérer les informations du commissariat');
                }
            }

            console.log('Using commissariat ID:', commissariatId);
            
            if (!commissariatId) {
                throw new Error('ID du commissariat non disponible');
            }

            const response = await api.get(`/declarations/commissariat/${commissariatId}`);
            console.log('Déclarations reçues:', response.data);
            
            if (Array.isArray(response.data)) {
                setDeclarations(response.data);
                setError(null);
            } else {
                console.error('Les données reçues ne sont pas un tableau:', response.data);
                setError('Format de données invalide reçu du serveur');
            }
        } catch (err) {
            console.error('Erreur détaillée lors du chargement des déclarations:', err);
            console.error('Response data:', err.response?.data);
            console.error('Response status:', err.response?.status);
            setError(err.message || err.response?.data?.message || 'Impossible de charger les déclarations du commissariat.');
            toast.error(err.message || err.response?.data?.message || 'Erreur lors du chargement des déclarations.');
        } finally {
            setLoading(false);
        }
    };

    // Charger les déclarations au montage du composant
    useEffect(() => {
        console.log('User data in useEffect:', user);
        if (user) {
            console.log('User role:', user.role);
            console.log('User commissariat:', user.commissariat);
            console.log('User commissariat type:', typeof user.commissariat);
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
                {user && (
                    <div>
                        <p>Bienvenue, {user.firstName} !</p>
                        {user.commissariat && (
                            <p>Vous gérez les déclarations du commissariat de {
                                typeof user.commissariat === 'object' && user.commissariat !== null
                                    ? `${user.commissariat.name} (${user.commissariat.city})`
                                    : 'votre commissariat'
                            }.</p>
                        )}
                    </div>
                )}

                <div className="declaration-list-container">
                    <h3>Déclarations à Gérer</h3>
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Chargement des données...</p>
                        </div>
                    ) : error ? (
                        <div className="error-container">
                            <p className="error-message">{error}</p>
                            <button onClick={fetchCommissariatDeclarations} className="btn primary-btn">
                                Réessayer
                            </button>
                        </div>
                    ) : declarations.length === 0 ? (
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
                                            <div className="status-change-container">
                                                <span className="current-status">Statut actuel: <strong>{declaration.status}</strong></span>
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
                                                <span className="status-change-hint">Sélectionnez un nouveau statut ci-dessus</span>
                                            </div>
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