// frontend/src/pages/UserDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import DeclarationForm from '../components/declaration/DeclarationForm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles/UserDashboard.css';
import { generateReceiptContent } from '../components/declaration/ReceiptGenerator';

dayjs.locale('fr');

function UserDashboard() {
    const { user } = useAuth();
    const [declarations, setDeclarations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDeclaration, setSelectedDeclaration] = useState(null);
    const [showDeclarationForm, setShowDeclarationForm] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [activeFilter, setActiveFilter] = useState('pending');

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
        console.log('Déclaration complète:', declaration);
        console.log('Type de déclaration:', declaration.declarationType);
        if (declaration.declarationType === 'objet') {
            console.log('Détails de l\'objet:', declaration.objectDetails);
            console.log('Catégorie:', declaration.objectDetails?.objectCategory);
            console.log('Nom:', declaration.objectDetails?.objectName);
        } else if (declaration.declarationType === 'personne') {
            console.log('Détails de la personne:', declaration.personDetails);
            console.log('Nom:', declaration.personDetails?.lastName);
            console.log('Prénom:', declaration.personDetails?.firstName);
        }
        setSelectedDeclaration(declaration);
    };

    const closeDetailsModal = () => {
        setSelectedDeclaration(null);
    };

    const openPhotoModal = (photo) => {
        setSelectedPhoto(photo);
    };

    const closePhotoModal = () => {
        setSelectedPhoto(null);
    };

    const handleNewDeclaration = () => {
        setShowDeclarationForm(true);
    };

    const handleDeclarationSubmit = async (newDeclaration) => {
        try {
            await fetchUserDeclarations();
            toast.success('Déclaration créée avec succès !');
        } catch (err) {
            console.error('Erreur lors de la création de la déclaration:', err);
            toast.error(err.response?.data?.message || 'Erreur lors de la création de la déclaration');
        }
        setShowDeclarationForm(false);
        setSelectedDeclaration(null);
    };

    const handleDownloadReceipt = async (declaration) => {
        try {
            // Générer le PDF du récépissé
            const receiptElement = document.createElement('div');
            receiptElement.style.width = '210mm';
            receiptElement.style.padding = '20mm';
            receiptElement.style.backgroundColor = 'white';
            receiptElement.style.fontFamily = 'Arial, sans-serif';
            receiptElement.style.position = 'absolute';
            receiptElement.style.left = '-9999px';
            receiptElement.innerHTML = generateReceiptContent(declaration);

            document.body.appendChild(receiptElement);

            const canvas = await html2canvas(receiptElement, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 0;

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            pdf.save(`recepisse_officiel_${declaration.receiptNumber}.pdf`);

            document.body.removeChild(receiptElement);

            toast.success('Récépissé téléchargé');
        } catch (error) {
            console.error('Erreur lors du téléchargement du récépissé:', error);
            toast.error('Erreur lors du téléchargement du récépissé');
        }
    };

    const handleDeleteDeclaration = async (declarationId) => {
        try {
            await api.delete(`/declarations/${declarationId}`);
            setDeclarations(prev => prev.filter(decl => decl._id !== declarationId));
            toast.success('Déclaration supprimée avec succès');
        } catch (err) {
            console.error('Erreur lors de la suppression de la déclaration:', err);
            toast.error(err.response?.data?.message || 'Erreur lors de la suppression de la déclaration');
        }
    };

    const filteredDeclarations = declarations.filter(declaration => {
        switch (activeFilter) {
            case 'pending':
                return declaration.status === 'En attente';
            case 'completed':
                return declaration.status === 'Traité';
            case 'rejected':
                return declaration.status === 'Refusée';
            default:
                return true;
        }
    });

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
                    <h3>En attente</h3>
                    <div className="number">
                        {declarations.filter(d => d.status === 'En attente').length}
                    </div>
                </div>
                <div className="stat-card">
                    <h3>Traitées</h3>
                    <div className="number">
                        {declarations.filter(d => d.status === 'Traité').length}
                    </div>
                </div>
                <div className="stat-card">
                    <h3>Refusées</h3>
                    <div className="number">
                        {declarations.filter(d => d.status === 'Refusée').length}
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
                    <div className="declaration-filters">
                        <button 
                            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('all')}
                        >
                            Toutes les déclarations
                        </button>
                        <button 
                            className={`filter-btn ${activeFilter === 'pending' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('pending')}
                        >
                            En attente
                        </button>
                        <button 
                            className={`filter-btn ${activeFilter === 'completed' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('completed')}
                        >
                            Traitées
                        </button>
                        <button 
                            className={`filter-btn ${activeFilter === 'rejected' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('rejected')}
                        >
                            Refusées
                        </button>
                    </div>

                    <h3>Mes déclarations</h3>
                    {filteredDeclarations.length === 0 ? (
                        <p>Aucune déclaration {activeFilter !== 'all' ? 'dans cette catégorie' : ''}.</p>
                    ) : (
                        <div className="declaration-cards">
                            {filteredDeclarations.map((declaration) => (
                                <div 
                                    key={declaration._id} 
                                    className="declaration-card"
                                    onClick={() => openDetailsModal(declaration)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <h4>Déclaration de {declaration.declarationType === 'objet' ? 'perte d\'objet' : 'disparition de personne'}</h4>
                                    <div className="declaration-info">
                                        <p><strong>N° de déclaration:</strong> {declaration._id}</p>
                                        <p>
                                            <strong>Statut:</strong>{' '}
                                            <span className={`status-badge status-${declaration.status.toLowerCase().replace(/\s/g, '-')}`}>
                                                {declaration.status}
                                            </span>
                                        </p>
                                        {declaration.status === 'Refusée' && declaration.rejectReason && (
                                            <div className="reject-reason">
                                                <strong>Motif du refus :</strong> {declaration.rejectReason}
                                            </div>
                                        )}
                                        {declaration.declarationType === 'objet' ? (
                                            <>
                                                <p><strong>Catégorie:</strong> {declaration.objectDetails?.objectCategory || 'Non spécifiée'}</p>
                                                <p><strong>Nom de l'objet:</strong> {declaration.objectDetails?.objectName || 'Non spécifié'}</p>
                                            </>
                                        ) : (
                                            <>
                                                <p><strong>Nom:</strong> {declaration.personDetails?.lastName || 'Non spécifié'}</p>
                                                <p><strong>Prénom:</strong> {declaration.personDetails?.firstName || 'Non spécifié'}</p>
                                            </>
                                        )}
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
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openPhotoModal(photo);
                                                    }}
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
                            {selectedDeclaration.status === 'Refusée' && selectedDeclaration.rejectReason && (
                                <div className="reject-reason">
                                    <strong>Motif du refus :</strong> {selectedDeclaration.rejectReason}
                                </div>
                            )}
                            <p><strong>Date:</strong> {dayjs(selectedDeclaration.declarationDate).format('DD MMMM YYYY à HH:mm')}</p>
                            <p><strong>Lieu:</strong> {selectedDeclaration.location}</p>
                            <p><strong>Description:</strong> {selectedDeclaration.description}</p>
                            <p><strong>Commissariat:</strong> {selectedDeclaration.commissariat?.name || 'Non assigné'}</p>

                            {/* Boutons d'action selon le statut */}
                            <div className="modal-footer">
                                {selectedDeclaration.status === 'Refusée' && (
                                    <button 
                                        onClick={() => handleDeleteDeclaration(selectedDeclaration._id)}
                                        className="btn delete-btn"
                                    >
                                        Supprimer la déclaration
                                    </button>
                                )}
                            </div>

                            {/* Détails spécifiques pour les objets perdus */}
                            {selectedDeclaration.declarationType === 'objet' && (
                                <div className="object-details">
                                    <h4>Détails de l'objet perdu</h4>
                                    <p><strong>Catégorie:</strong> {selectedDeclaration.objectDetails?.objectCategory || 'Non spécifiée'}</p>
                                    <p><strong>Nom:</strong> {selectedDeclaration.objectDetails?.objectName || 'Non spécifié'}</p>
                                    {selectedDeclaration.objectDetails?.objectBrand && (
                                        <p><strong>Marque:</strong> {selectedDeclaration.objectDetails.objectBrand}</p>
                                    )}
                                    {selectedDeclaration.objectDetails?.color && (
                                        <p><strong>Couleur:</strong> {selectedDeclaration.objectDetails.color}</p>
                                    )}
                                    {selectedDeclaration.objectDetails?.serialNumber && (
                                        <p><strong>Numéro de série:</strong> {selectedDeclaration.objectDetails.serialNumber}</p>
                                    )}
                                    {selectedDeclaration.objectDetails?.estimatedValue && (
                                        <p><strong>Valeur estimée:</strong> {selectedDeclaration.objectDetails.estimatedValue} €</p>
                                    )}
                                    {selectedDeclaration.objectDetails?.identificationMarks && (
                                        <p><strong>Signes particuliers:</strong> {selectedDeclaration.objectDetails.identificationMarks}</p>
                                    )}
                                </div>
                            )}

                            {/* Détails spécifiques pour les personnes disparues */}
                            {selectedDeclaration.declarationType === 'personne' && selectedDeclaration.personDetails && (
                                <div className="person-details">
                                    <h4>Détails de la personne disparue</h4>
                                    <p><strong>Nom:</strong> {selectedDeclaration.personDetails.lastName || 'Non spécifié'}</p>
                                    <p><strong>Prénom:</strong> {selectedDeclaration.personDetails.firstName || 'Non spécifié'}</p>
                                    <p><strong>Date de naissance:</strong> {selectedDeclaration.personDetails.dateOfBirth ? dayjs(selectedDeclaration.personDetails.dateOfBirth).format('DD MMMM YYYY') : 'Non spécifiée'}</p>
                                    <p><strong>Genre:</strong> {selectedDeclaration.personDetails.gender || 'Non spécifié'}</p>
                                    {selectedDeclaration.personDetails.height && (
                                        <p><strong>Taille:</strong> {selectedDeclaration.personDetails.height} cm</p>
                                    )}
                                    {selectedDeclaration.personDetails.weight && (
                                        <p><strong>Poids:</strong> {selectedDeclaration.personDetails.weight} kg</p>
                                    )}
                                    {selectedDeclaration.personDetails.clothingDescription && (
                                        <p><strong>Description des vêtements:</strong> {selectedDeclaration.personDetails.clothingDescription}</p>
                                    )}
                                    {selectedDeclaration.personDetails.lastSeenLocation && (
                                        <p><strong>Dernier lieu vu:</strong> {selectedDeclaration.personDetails.lastSeenLocation}</p>
                                    )}
                                    {selectedDeclaration.personDetails.distinguishingMarks && (
                                        <p><strong>Signes distinctifs:</strong> {selectedDeclaration.personDetails.distinguishingMarks}</p>
                                    )}
                                </div>
                            )}
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

                        {/* Section du récépissé */}
                        {selectedDeclaration.receiptNumber && (
                            <div className="receipt-section">
                                <h4>Récépissé Officiel</h4>
                                <div className="receipt-info">
                                    <p>Récépissé N° {selectedDeclaration.receiptNumber}</p>
                                    <p>Établi le {dayjs(selectedDeclaration.receiptDate).format('DD MMMM YYYY')}</p>
                                    <p>Traîté le {dayjs(selectedDeclaration.processedAt).format('DD MMMM YYYY à HH:mm')}</p>
                                    <button 
                                        onClick={() => handleDownloadReceipt(selectedDeclaration)}
                                        className="btn primary-btn"
                                    >
                                        Télécharger le récépissé
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {selectedPhoto && (
                <div className="modal-overlay" onClick={closePhotoModal}>
                    <div className="photo-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={closePhotoModal}>&times;</button>
                        <img 
                            src={`http://localhost:5000/uploads/${selectedPhoto}`} 
                            alt="Photo agrandie" 
                            className="enlarged-photo"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserDashboard;