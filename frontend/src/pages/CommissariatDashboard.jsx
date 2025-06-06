// frontend/src/pages/CommissariatDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import 'dayjs/locale/fr'; // Importer la locale française pour dayjs
import '../styles/CommissariatDashboard.css'; // Import du CSS
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaChartBar } from 'react-icons/fa';
import NotificationCounter from '../components/common/NotificationCounter';
import ReceiptGenerator from '../components/declaration/ReceiptGenerator';
dayjs.locale('fr');

function CommissariatDashboard() {
    const { user, setUser } = useAuth();
    const [declarations, setDeclarations] = useState([]);
    const [rejectedDeclarations, setRejectedDeclarations] = useState([]);
    const [treatedDeclarations, setTreatedDeclarations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDeclaration, setSelectedDeclaration] = useState(null);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [activeTab, setActiveTab] = useState('pending');
    const [activeSidebarTab, setActiveSidebarTab] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const location = useLocation();
    const navigate = useNavigate();

    // Détecter l'onglet actif en fonction de l'URL
    useEffect(() => {
        const path = location.pathname;
        if (path === '/commissariat-dashboard') {
            setActiveSidebarTab('dashboard');
        } else if (path === '/commissariat-dashboard/statistics') {
            setActiveSidebarTab('statistics');
        }
    }, [location.pathname]);

    const fetchCommissariatDeclarations = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!user || user.role !== 'commissariat_agent') {
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

            console.log('Fetching declarations for commissariat:', commissariatId);
            const response = await api.get(`/declarations/commissariat/${commissariatId}`);
            console.log('Raw response data:', response.data);

            if (Array.isArray(response.data)) {
                // Séparer les déclarations par statut
                const pendingDeclarations = response.data.filter(decl => decl.status === 'En attente');
                const rejectedDeclarations = response.data.filter(decl => decl.status === 'Refusée');
                const treatedDeclarations = response.data.filter(decl => decl.status === 'Traité');

                console.log('Pending declarations:', pendingDeclarations.length);
                console.log('Rejected declarations:', rejectedDeclarations.length);
                console.log('Treated declarations:', treatedDeclarations.length);

                setDeclarations(pendingDeclarations);
                setRejectedDeclarations(rejectedDeclarations);
                setTreatedDeclarations(treatedDeclarations);
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

    // Charger les déclarations au montage du composant
    useEffect(() => {
        console.log('User data in useEffect:', user);
        if (user) {
            console.log('User role:', user.role);
            console.log('User commissariat:', user.commissariat);
            console.log('User commissariat type:', typeof user.commissariat);
            
            // Si c'est un agent de commissariat mais que les infos du commissariat ne sont pas présentes
            if (user.role === 'commissariat_agent' && !user.commissariat) {
                // Recharger les données utilisateur
                api.get('/auth/me')
                    .then(response => {
                        if (response.data.commissariat) {
                            setUser(prevUser => ({
                                ...prevUser,
                                commissariat: response.data.commissariat
                            }));
                        }
                    })
                    .catch(error => {
                        console.error('Erreur lors du rechargement des données utilisateur:', error);
                        toast.error('Erreur lors du chargement des informations du commissariat');
                    });
            }
            
            fetchCommissariatDeclarations();
        }
    }, [user]);

    const openDetailsModal = (declaration) => {
        setSelectedDeclaration(declaration);
    };

    const closeDetailsModal = () => {
        setSelectedDeclaration(null);
    };

    const openPhotoModal = (photoUrl, e) => {
        e.stopPropagation(); // Empêche l'ouverture de la modal de détails
        setSelectedPhoto(photoUrl);
    };

    const closePhotoModal = () => {
        setSelectedPhoto(null);
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
                // Mettre à jour les listes de déclarations
                setDeclarations(prev => prev.filter(decl => decl._id !== selectedDeclaration._id));
                setRejectedDeclarations(prev => [...prev, response.data]);
                
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

    // Fonction de filtrage des déclarations
    const filterDeclarations = (declarations) => {
        if (!searchQuery.trim()) return declarations;
        
        const query = searchQuery.toLowerCase().trim();
        return declarations.filter(declaration => {
            const declarationId = declaration.declarationNumber || declaration._id;
            const declarantName = declaration.user ? 
                `${declaration.user.firstName} ${declaration.user.lastName}`.toLowerCase() : '';
            
            return declarationId.toLowerCase().includes(query) || 
                   declarantName.includes(query);
        });
    };

    const renderContent = () => {
        switch (activeSidebarTab) {
            case 'dashboard':
                return (
                    <>
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

                        <div className="declaration-tabs">
                            <button 
                                className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
                                onClick={() => setActiveTab('pending')}
                            >
                                Déclarations en attente
                            </button>
                            <button 
                                className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
                                onClick={() => setActiveTab('rejected')}
                            >
                                Déclarations refusées
                            </button>
                            <button 
                                className={`tab-button ${activeTab === 'treated' ? 'active' : ''}`}
                                onClick={() => setActiveTab('treated')}
                            >
                                Déclarations traitées
                            </button>
                        </div>

                        <div className="declaration-list-container">
                            <h3>{
                                activeTab === 'pending' ? 'Déclarations en Attente' :
                                activeTab === 'rejected' ? 'Déclarations Refusées' :
                                'Déclarations Traitées'
                            }</h3>

                            {/* Barre de recherche pour les déclarations refusées et traitées */}
                            {(activeTab === 'rejected' || activeTab === 'treated') && (
                                <div className="search-container">
                                    <input
                                        type="text"
                                        placeholder="Rechercher par numéro de déclaration..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input"
                                    />
                                    {searchQuery && (
                                        <button 
                                            className="clear-search-btn"
                                            onClick={() => setSearchQuery('')}
                                        >
                                            Effacer
                                        </button>
                                    )}
                                </div>
                            )}

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
                            ) : (activeTab === 'pending' ? declarations : 
                                 activeTab === 'rejected' ? filterDeclarations(rejectedDeclarations) :
                                 filterDeclarations(treatedDeclarations)).length === 0 ? (
                                <p>Aucune déclaration {
                                    activeTab === 'pending' ? 'en attente' :
                                    activeTab === 'rejected' ? 'refusée' :
                                    'traitée'
                                } {searchQuery ? 'ne correspond à votre recherche' : 'pour votre commissariat pour l\'instant'}.</p>
                            ) : (
                                <div className="declaration-cards">
                                    {(activeTab === 'pending' ? declarations : 
                                      activeTab === 'rejected' ? filterDeclarations(rejectedDeclarations) :
                                      filterDeclarations(treatedDeclarations)).map((declaration) => (
                                        <div 
                                            key={declaration._id} 
                                            className="declaration-card"
                                            onClick={() => openDetailsModal(declaration)}
                                            style={{ cursor: 'pointer' }}
                                            title="Cliquez ici pour voir les détails de la déclaration"
                                        >
                                            <div className="declaration-info">
                                                <h4>Déclaration de {declaration.declarationType === 'objet' ? 'perte d\'objet' : 'disparition de personne'}</h4>
                                                <p><strong>N° de déclaration:</strong> {declaration.declarationNumber || declaration._id}</p>
                                                <p><strong>Statut:</strong> <span className={`status-${declaration.status.toLowerCase().replace(/\s/g, '-')}`}>{declaration.status}</span></p>
                                                {declaration.status === 'Refusée' && declaration.rejectReason && (
                                                    <p><strong>Motif du refus:</strong> {declaration.rejectReason}</p>
                                                )}
                                                <p><strong>Déclarant:</strong> {declaration.user ? `${declaration.user.firstName} ${declaration.user.lastName}` : 'Inconnu'}</p>
                                                {declaration.declarationType === 'objet' && (
                                                    <>
                                                        <p><strong>Catégorie:</strong> {declaration.objectDetails?.objectCategory || 'Non spécifiée'}</p>
                                                        <p><strong>Nom:</strong> {declaration.objectDetails?.objectName || 'Non spécifié'}</p>
                                                        <p><strong>Marque:</strong> {declaration.objectDetails?.objectBrand || 'Non spécifiée'}</p>
                                                    </>
                                                )}
                                                {declaration.declarationType === 'personne' && (
                                                    <>
                                                        <p><strong>Nom:</strong> {declaration.personDetails?.lastName || 'Non spécifié'}</p>
                                                        <p><strong>Prénom:</strong> {declaration.personDetails?.firstName || 'Non spécifié'}</p>
                                                        <p><strong>Date de naissance:</strong> {declaration.personDetails?.dateOfBirth ? dayjs(declaration.personDetails.dateOfBirth).format('DD MMMM YYYY') : 'Non spécifiée'}</p>
                                                        {declaration.personDetails?.gender && <p><strong>Genre:</strong> {declaration.personDetails.gender}</p>}
                                                        <p><strong>Dernier lieu vu:</strong> {declaration.personDetails?.lastSeenLocation || declaration.location}</p>
                                                    </>
                                                )}
                                                {declaration.status === 'Traité' && (
                                                    <>
                                                        <p><strong>Date de traitement:</strong> {dayjs(declaration.processedAt).format('DD/MM/YYYY HH:mm')}</p>
                                                        <p><strong>Récépissé:</strong> {declaration.receiptNumber || 'Non disponible'}</p>
                                                    </>
                                                )}
                                            </div>

                                            {declaration.photos && declaration.photos.length > 0 ? (
                                                <div className="declaration-photos" onClick={e => e.stopPropagation()}>
                                                    {declaration.photos.map((photo, index) => (
                                                        <img 
                                                            key={index} 
                                                            src={`http://localhost:5000/uploads/${photo}`} 
                                                            alt={`Photo ${index + 1}`} 
                                                            className="declaration-photo-thumbnail"
                                                            onClick={(e) => openPhotoModal(`http://localhost:5000/uploads/${photo}`, e)}
                                                            title="Cliquez pour voir la photo en grand"
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="no-photos">
                                                    <p>Aucune photo disponible</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                );
            case 'statistics':
                return (
                    <div className="statistics-container">
                        <h2>Statistiques</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h3>Total des déclarations</h3>
                                <p className="stat-number">{declarations.length + rejectedDeclarations.length + treatedDeclarations.length}</p>
                            </div>
                            <div className="stat-card">
                                <h3>En attente</h3>
                                <p className="stat-number">{declarations.length}</p>
                            </div>
                            <div className="stat-card">
                                <h3>Refusées</h3>
                                <p className="stat-number">{rejectedDeclarations.length}</p>
                            </div>
                            <div className="stat-card">
                                <h3>Traitées</h3>
                                <p className="stat-number">{treatedDeclarations.length}</p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="dashboard commissariat-dashboard">
            {/* Sidebar */}
            <aside className="sidebar">
                {user && user.commissariat && (
                    <div className="commissariat-info">
                        <h3>{
                            typeof user.commissariat === 'object' && user.commissariat !== null
                                ? user.commissariat.name
                                : 'Votre Commissariat'
                        }</h3>
                        <p>{
                            typeof user.commissariat === 'object' && user.commissariat !== null
                                ? user.commissariat.city
                                : ''
                        }</p>
                    </div>
                )}
                <nav>
                    <ul className="sidebar-menu">
                        <li>
                            <Link 
                                to="/commissariat-dashboard" 
                                className={`sidebar-link ${location.pathname === '/commissariat-dashboard' ? 'active' : ''}`}
                                onClick={() => setActiveSidebarTab('dashboard')}
                            >
                                <FaHome /> Tableau de bord
                            </Link>
                        </li>
                        <li>
                            <Link 
                                to="/commissariat-dashboard/statistics" 
                                className={`sidebar-link ${location.pathname === '/commissariat-dashboard/statistics' ? 'active' : ''}`}
                                onClick={() => setActiveSidebarTab('statistics')}
                            >
                                <FaChartBar /> Statistiques
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Contenu principal */}
            <main className="dashboard-content">
                {renderContent()}
            </main>

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
                            {selectedDeclaration.declarationType === 'personne' && (
                                <>
                                    <p><strong>Nom:</strong> {selectedDeclaration.personDetails?.lastName || 'Non spécifié'}</p>
                                    <p><strong>Prénom:</strong> {selectedDeclaration.personDetails?.firstName || 'Non spécifié'}</p>
                                    <p><strong>Date de naissance:</strong> {selectedDeclaration.personDetails?.dateOfBirth ? dayjs(selectedDeclaration.personDetails.dateOfBirth).format('DD MMMM YYYY') : 'Non spécifiée'}</p>
                                    {selectedDeclaration.personDetails?.gender && <p><strong>Genre:</strong> {selectedDeclaration.personDetails.gender}</p>}
                                    <p><strong>Dernier lieu vu:</strong> {selectedDeclaration.personDetails?.lastSeenLocation || selectedDeclaration.location}</p>
                                </>
                            )}
                            <p><strong>Statut:</strong> {selectedDeclaration.status}</p>
                            {selectedDeclaration.status === 'Refusée' && selectedDeclaration.rejectReason && (
                                <p><strong>Motif du refus:</strong> {selectedDeclaration.rejectReason}</p>
                            )}
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
                                {selectedDeclaration.personDetails.gender && <p><strong>Genre:</strong> {selectedDeclaration.personDetails.gender}</p>}
                                {selectedDeclaration.personDetails.height && <p><strong>Taille:</strong> {selectedDeclaration.personDetails.height} cm</p>}
                                {selectedDeclaration.personDetails.weight && <p><strong>Poids:</strong> {selectedDeclaration.personDetails.weight} kg</p>}
                                {selectedDeclaration.personDetails.clothingDescription && <p><strong>Description des vêtements:</strong> {selectedDeclaration.personDetails.clothingDescription}</p>}
                                {selectedDeclaration.personDetails.distinguishingMarks && <p><strong>Signes particuliers:</strong> {selectedDeclaration.personDetails.distinguishingMarks}</p>}
                                {selectedDeclaration.personDetails.medicalConditions && <p><strong>Conditions médicales:</strong> {selectedDeclaration.personDetails.medicalConditions}</p>}
                                {selectedDeclaration.personDetails.contactInfo && <p><strong>Contact d'urgence:</strong> {selectedDeclaration.personDetails.contactInfo}</p>}
                                <p><strong>Dernier lieu vu:</strong> {selectedDeclaration.personDetails.lastSeenLocation || selectedDeclaration.location}</p>
                                {selectedDeclaration.personDetails.lastSeenDate && <p><strong>Dernière date de vue:</strong> {dayjs(selectedDeclaration.personDetails.lastSeenDate).format('DD MMMM YYYY à HH:mm')}</p>}
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
                                            const updatedDeclaration = {
                                                ...selectedDeclaration,
                                                receiptNumber,
                                                receiptDate: new Date().toISOString(),
                                                status: 'Traité',
                                                processedAt: new Date().toISOString()
                                            };

                                            // Mettre à jour les listes de déclarations
                                            setDeclarations(prev => prev.filter(decl => decl._id !== selectedDeclaration._id));
                                            setTreatedDeclarations(prev => [...prev, updatedDeclaration]);
                                            setSelectedDeclaration(updatedDeclaration);

                                            // Mettre à jour la déclaration dans la base de données
                                            api.put(`/declarations/${updatedDeclaration._id}`, updatedDeclaration)
                                                .then(() => {
                                                    toast.success('Déclaration traitée avec succès');
                                                    fetchCommissariatDeclarations(); // Recharger toutes les déclarations
                                                })
                                                .catch(error => {
                                                    console.error('Erreur lors de la mise à jour de la déclaration:', error);
                                                    toast.error('Erreur lors de la mise à jour de la déclaration');
                                                });
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Boutons d'action selon le statut */}
                        <div className="modal-footer">
                            {selectedDeclaration.status === 'En attente' && (
                                <button 
                                    className="btn reject-btn"
                                    onClick={() => setShowRejectModal(true)}
                                >
                                    Refuser la déclaration
                                </button>
                            )}
                        </div>
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

            {/* Modal pour les photos en grand */}
            {selectedPhoto && (
                <div className="modal-overlay" onClick={closePhotoModal}>
                    <div className="photo-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={closePhotoModal}>&times;</button>
                        <img src={selectedPhoto} alt="Photo en grand" className="full-size-photo" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default CommissariatDashboard;