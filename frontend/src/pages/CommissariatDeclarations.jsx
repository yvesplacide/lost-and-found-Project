import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaList, FaChartBar, FaCog, FaBell } from 'react-icons/fa';
import NotificationCounter from '../components/common/NotificationCounter';
import ReceiptGenerator from '../components/declaration/ReceiptGenerator';
import '../styles/CommissariatDashboard.css';

dayjs.locale('fr');

function CommissariatDeclarations() {
    const { user } = useAuth();
    const [declarations, setDeclarations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDeclaration, setSelectedDeclaration] = useState(null);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        dateRange: 'all',
        type: 'all'
    });
    const location = useLocation();

    const statusOptions = [
        'En attente',
        'Traité',
        'Refusée'
    ];

    const fetchCommissariatDeclarations = async () => {
        if (!user) {
            console.log('User not available');
            setError('Informations de commissariat non disponibles pour cet agent.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            
            if (user.role !== 'commissariat_agent') {
                throw new Error('Accès non autorisé. Vous devez être un agent de commissariat.');
            }

            let commissariatId;
            if (user.commissariat) {
                commissariatId = typeof user.commissariat === 'object' 
                    ? user.commissariat._id 
                    : user.commissariat;
            } else {
                const userResponse = await api.get('/auth/me');
                if (userResponse.data.commissariat) {
                    commissariatId = typeof userResponse.data.commissariat === 'object' 
                        ? userResponse.data.commissariat._id 
                        : userResponse.data.commissariat;
                } else {
                    throw new Error('Commissariat non assigné à cet agent');
                }
            }

            if (!commissariatId) {
                throw new Error('ID du commissariat non disponible');
            }

            const response = await api.get(`/declarations/commissariat/${commissariatId}`);
            
            if (Array.isArray(response.data)) {
                // Ne garder que les déclarations traitées
                const treated = response.data.filter(decl => decl.status === 'Traité');
                setDeclarations(treated);
                setError(null);
            } else {
                setError('Format de données invalide reçu du serveur');
            }
        } catch (err) {
            console.error('Erreur lors du chargement des déclarations:', err);
            setError(err.message || err.response?.data?.message || 'Impossible de charger les déclarations.');
            toast.error(err.message || err.response?.data?.message || 'Erreur lors du chargement des déclarations.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchCommissariatDeclarations();
        }
    }, [user]);

    const handleStatusChange = async (declarationId, newStatus) => {
        try {
            // Si le nouveau statut est "Refusée", ouvrir la modal de refus
            if (newStatus === 'Refusée') {
                setSelectedDeclaration(declarations.find(decl => decl._id === declarationId));
                setShowRejectModal(true);
                return;
            }

            const updateData = {
                status: newStatus,
                agentAssigned: user._id
            };

            const response = await api.put(`/declarations/${declarationId}/status`, updateData);
            
            setDeclarations(prev =>
                prev.map(decl =>
                    decl._id === declarationId ? response.data : decl
                )
            );
            
            if (selectedDeclaration && selectedDeclaration._id === declarationId) {
                setSelectedDeclaration(response.data);
            }
            
            toast.success('Statut mis à jour avec succès');
        } catch (err) {
            console.error('Erreur lors de la mise à jour du statut:', err);
            toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour du statut');
        }
    };

    const openDetailsModal = (declaration) => {
        setSelectedDeclaration(declaration);
    };

    const closeDetailsModal = () => {
        setSelectedDeclaration(null);
    };

    const openPhotoModal = (photoUrl, e) => {
        e.stopPropagation();
        setSelectedPhoto(photoUrl);
    };

    const closePhotoModal = () => {
        setSelectedPhoto(null);
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const filterDeclarations = (declarations) => {
        return declarations.filter(decl => {
            if (filters.status !== 'all' && decl.status !== filters.status) return false;
            if (filters.type !== 'all' && decl.declarationType !== filters.type) return false;
            if (filters.dateRange !== 'all') {
                const declarationDate = new Date(decl.declarationDate);
                const now = new Date();
                const diffDays = Math.floor((now - declarationDate) / (1000 * 60 * 60 * 24));
                
                switch (filters.dateRange) {
                    case 'today':
                        return diffDays === 0;
                    case 'week':
                        return diffDays <= 7;
                    case 'month':
                        return diffDays <= 30;
                    default:
                        return true;
                }
            }
            return true;
        });
    };

    const handleRejectDeclaration = async () => {
        if (!rejectReason.trim()) {
            toast.error('Veuillez saisir un motif de refus');
            return;
        }

        try {
            const updateData = {
                status: 'Refusée',
                rejectReason: rejectReason.trim(),
                agentAssigned: user._id,
                updatedAt: new Date().toISOString()
            };

            console.log('Envoi des données de refus:', updateData);

            const response = await api.put(`/declarations/${selectedDeclaration._id}/status`, updateData);

            if (response.data) {
                setDeclarations(prev => prev.filter(decl => decl._id !== selectedDeclaration._id));
                setShowRejectModal(false);
                setRejectReason('');
                setSelectedDeclaration(null);
                toast.success('Déclaration refusée avec succès');
            } else {
                throw new Error('Réponse invalide du serveur');
            }
        } catch (err) {
            console.error('Erreur lors du refus de la déclaration:', err);
            console.error('Détails de l\'erreur:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            toast.error(err.response?.data?.message || 'Erreur lors du refus de la déclaration');
        }
    };

    return (
        <div className="dashboard commissariat-dashboard">
            {/* Sidebar */}
            <aside className="sidebar">
                <nav>
                    <ul className="sidebar-menu">
                        <li>
                            <Link 
                                to="/commissariat-dashboard" 
                                className={location.pathname === '/commissariat-dashboard' ? 'active' : ''}
                            >
                                <FaHome /> Tableau de bord
                            </Link>
                        </li>
                        <li>
                            <Link 
                                to="/commissariat-dashboard/declarations" 
                                className={location.pathname.includes('/commissariat-dashboard/declarations') ? 'active' : ''}
                            >
                                <FaList /> Déclarations traitées
                            </Link>
                        </li>
                        <li>
                            <Link 
                                to="/commissariat-dashboard/statistics" 
                                className={location.pathname === '/commissariat-dashboard/statistics' ? 'active' : ''}
                            >
                                <FaChartBar /> Statistiques
                            </Link>
                        </li>
                        <li>
                            <Link 
                                to="/commissariat-dashboard/notifications" 
                                className={location.pathname === '/commissariat-dashboard/notifications' ? 'active' : ''} 
                                style={{ position: 'relative' }}
                            >
                                <FaBell /> Notifications
                                <NotificationCounter />
                            </Link>
                        </li>
                        <li>
                            <Link 
                                to="/commissariat-dashboard/settings" 
                                className={location.pathname === '/commissariat-dashboard/settings' ? 'active' : ''}
                            >
                                <FaCog /> Paramètres
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Contenu principal */}
            <main className="dashboard-content">
                <h2>Déclarations Traitées</h2>
                {user && (
                    <div className="welcome-section">
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

                {/* Filtres */}
                <div className="filters-section">
                    <div className="filter-group">
                        <label>Type:</label>
                        <select 
                            value={filters.type} 
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                        >
                            <option value="all">Tous les types</option>
                            <option value="objet">Perte d'objet</option>
                            <option value="personne">Disparition de personne</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Période:</label>
                        <select 
                            value={filters.dateRange} 
                            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                        >
                            <option value="all">Toutes les périodes</option>
                            <option value="today">Aujourd'hui</option>
                            <option value="week">Cette semaine</option>
                            <option value="month">Ce mois</option>
                        </select>
                    </div>
                </div>

                <div className="declaration-list-container">
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
                        <p>Aucune déclaration traitée pour votre commissariat pour l'instant.</p>
                    ) : (
                        <div className="declarations-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>N° Déclaration</th>
                                        <th>Type</th>
                                        <th>Déclarant</th>
                                        <th>Date</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filterDeclarations(declarations).map((declaration) => (
                                        <tr key={declaration._id}>
                                            <td>{declaration._id}</td>
                                            <td>{declaration.declarationType === 'objet' ? 'Perte d\'objet' : 'Disparition de personne'}</td>
                                            <td>{declaration.user ? `${declaration.user.firstName} ${declaration.user.lastName}` : 'Inconnu'}</td>
                                            <td>{dayjs(declaration.declarationDate).format('DD/MM/YYYY HH:mm')}</td>
                                            <td>
                                                <span className={`status-badge status-${declaration.status.toLowerCase().replace(/\s/g, '-')}`}>
                                                    {declaration.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button 
                                                        className="btn details-btn"
                                                        onClick={() => openDetailsModal(declaration)}
                                                    >
                                                        Détails
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal pour les détails de la déclaration */}
                {selectedDeclaration && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <button className="modal-close-btn" onClick={closeDetailsModal}>&times;</button>
                            <h3>Détails de la Déclaration {selectedDeclaration.receiptNumber ? `: ${selectedDeclaration.receiptNumber}` : ''}</h3>
                            
                            <div className="details-section">
                                <h4>Informations Générales</h4>
                                <p><strong>Type:</strong> {selectedDeclaration.declarationType === 'objet' ? 'Perte d\'objet' : 'Disparition de personne'}</p>
                                {selectedDeclaration.declarationType === 'objet' && (
                                    <>
                                        <p><strong>Catégorie:</strong> {selectedDeclaration.objectDetails?.objectCategory || 'Non spécifiée'}</p>
                                        <p><strong>Nom:</strong> {selectedDeclaration.objectDetails?.objectName || 'Non spécifié'}</p>
                                        <p><strong>Marque:</strong> {selectedDeclaration.objectDetails?.objectBrand || 'Non spécifiée'}</p>
                                    </>
                                )}
                                <p><strong>Statut:</strong> {selectedDeclaration.status}</p>
                                <p><strong>Date:</strong> {dayjs(selectedDeclaration.declarationDate).format('DD MMMM YYYY à HH:mm')}</p>
                                <p><strong>Lieu:</strong> {selectedDeclaration.location}</p>
                                <p><strong>Description:</strong> {selectedDeclaration.description}</p>
                            </div>

                            <div className="details-section">
                                <h4>Informations du Déclarant</h4>
                                <p><strong>Nom:</strong> {selectedDeclaration.user?.firstName} {selectedDeclaration.user?.lastName}</p>
                                <p><strong>Email:</strong> {selectedDeclaration.user?.email}</p>
                                <p><strong>Téléphone:</strong> {selectedDeclaration.user?.phone || 'Non renseigné'}</p>
                            </div>

                            {selectedDeclaration.declarationType === 'personne' && selectedDeclaration.personDetails && (
                                <div className="details-section">
                                    <h4>Détails de la personne</h4>
                                    <p><strong>Nom:</strong> {selectedDeclaration.personDetails.lastName}, <strong>Prénom:</strong> {selectedDeclaration.personDetails.firstName}</p>
                                    <p><strong>Date de naissance:</strong> {dayjs(selectedDeclaration.personDetails.dateOfBirth).format('DD MMMM YYYY')}</p>
                                    {selectedDeclaration.personDetails.lastSeenLocation && <p><strong>Dernier lieu vu:</strong> {selectedDeclaration.personDetails.lastSeenLocation}</p>}
                                </div>
                            )}

                            {selectedDeclaration.commissariat && (
                                <div className="details-section">
                                    <h4>Commissariat assigné</h4>
                                    <p><strong>Nom:</strong> {selectedDeclaration.commissariat.name}</p>
                                    <p><strong>Ville:</strong> {selectedDeclaration.commissariat.city}</p>
                                    <p><strong>Adresse:</strong> {selectedDeclaration.commissariat.address}</p>
                                    <p><strong>Email:</strong> {selectedDeclaration.commissariat.email}</p>
                                    <p><strong>Téléphone:</strong> {selectedDeclaration.commissariat.phone}</p>
                                </div>
                            )}

                            {selectedDeclaration.photos && selectedDeclaration.photos.length > 0 && (
                                <div className="details-section">
                                    <h4>Photos</h4>
                                    <div className="photo-grid">
                                        {selectedDeclaration.photos.map((photo, index) => (
                                            <img 
                                                key={index} 
                                                src={`http://localhost:5000/uploads/${photo}`} 
                                                alt={`Photo ${index + 1}`} 
                                                className="declaration-photo"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openPhotoModal(`http://localhost:5000/uploads/${photo}`, e);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Section du récépissé */}
                            <div className="receipt-section">
                                <h4>Récépissé Officiel</h4>
                                {selectedDeclaration.receiptNumber ? (
                                    <div className="receipt-info">
                                        <p>Récépissé N° {selectedDeclaration.receiptNumber} établi le {dayjs(selectedDeclaration.receiptDate).format('DD/MM/YYYY')}</p>
                                        <p className="receipt-status">Le déclarant peut télécharger ce récépissé depuis son espace personnel</p>
                                    </div>
                                ) : (
                                    <div className="receipt-actions">
                                        <p>Établir un récépissé officiel pour cette déclaration</p>
                                        <ReceiptGenerator 
                                            declaration={selectedDeclaration} 
                                            onReceiptGenerated={(receiptNumber) => {
                                                setDeclarations(prevDeclarations =>
                                                    prevDeclarations.map(decl =>
                                                        decl._id === selectedDeclaration._id
                                                            ? { ...decl, receiptNumber, receiptDate: new Date().toISOString() }
                                                            : decl
                                                    )
                                                );
                                                setSelectedDeclaration(prev => ({
                                                    ...prev,
                                                    receiptNumber,
                                                    receiptDate: new Date().toISOString()
                                                }));
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal pour les photos en grand */}
                {selectedPhoto && (
                    <div className="modal-overlay" onClick={closePhotoModal}>
                        <div className="photo-modal-content" onClick={e => e.stopPropagation()}>
                            <button className="modal-close-btn" onClick={closePhotoModal}>&times;</button>
                            <img src={selectedPhoto} alt="Photo en grand" className="full-size-photo" />
                        </div>
                    </div>
                )}

                {/* Modal de confirmation de refus */}
                {showRejectModal && (
                    <div className="modal-overlay">
                        <div className="modal-content reject-modal">
                            <button className="modal-close-btn" onClick={() => setShowRejectModal(false)}>&times;</button>
                            <h3>Refuser la déclaration</h3>
                            <p>Veuillez indiquer le motif du refus :</p>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Saisissez le motif du refus..."
                                rows="4"
                                className="reject-reason-input"
                            />
                            <div className="modal-actions">
                                <button 
                                    className="btn cancel-btn"
                                    onClick={() => setShowRejectModal(false)}
                                >
                                    Annuler
                                </button>
                                <button 
                                    className="btn confirm-reject-btn"
                                    onClick={handleRejectDeclaration}
                                >
                                    Confirmer le refus
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default CommissariatDeclarations; 