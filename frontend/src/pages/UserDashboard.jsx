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

dayjs.locale('fr');

function UserDashboard() {
    const { user } = useAuth();
    const [declarations, setDeclarations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDeclaration, setSelectedDeclaration] = useState(null);
    const [showDeclarationForm, setShowDeclarationForm] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

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
        console.log('Détails de l\'objet:', declaration.objectDetails);
        console.log('Catégorie:', declaration.objectCategory);
        console.log('Nom:', declaration.objectName);
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
                            <p><strong>Date:</strong> {dayjs(selectedDeclaration.declarationDate).format('DD MMMM YYYY à HH:mm')}</p>
                            <p><strong>Lieu:</strong> {selectedDeclaration.location}</p>
                            <p><strong>Description:</strong> {selectedDeclaration.description}</p>
                            <p><strong>Commissariat:</strong> {selectedDeclaration.commissariat?.name || 'Non assigné'}</p>

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
                                    <p><strong>Nom:</strong> {selectedDeclaration.personDetails.lastName}</p>
                                    <p><strong>Prénom:</strong> {selectedDeclaration.personDetails.firstName}</p>
                                    <p><strong>Date de naissance:</strong> {dayjs(selectedDeclaration.personDetails.dateOfBirth).format('DD MMMM YYYY')}</p>
                                    <p><strong>Âge:</strong> {selectedDeclaration.personDetails.age} ans</p>
                                    <p><strong>Genre:</strong> {selectedDeclaration.personDetails.gender}</p>
                                    {selectedDeclaration.personDetails.height && (
                                        <p><strong>Taille:</strong> {selectedDeclaration.personDetails.height} cm</p>
                                    )}
                                    {selectedDeclaration.personDetails.weight && (
                                        <p><strong>Poids:</strong> {selectedDeclaration.personDetails.weight} kg</p>
                                    )}
                                    {selectedDeclaration.personDetails.clothing && (
                                        <p><strong>Vêtements:</strong> {selectedDeclaration.personDetails.clothing}</p>
                                    )}
                                    {selectedDeclaration.personDetails.lastSeenLocation && (
                                        <p><strong>Dernier lieu vu:</strong> {selectedDeclaration.personDetails.lastSeenLocation}</p>
                                    )}
                                    {selectedDeclaration.personDetails.lastSeenDate && (
                                        <p><strong>Dernière date de vue:</strong> {dayjs(selectedDeclaration.personDetails.lastSeenDate).format('DD MMMM YYYY à HH:mm')}</p>
                                    )}
                                    {selectedDeclaration.personDetails.medicalConditions && (
                                        <p><strong>Conditions médicales:</strong> {selectedDeclaration.personDetails.medicalConditions}</p>
                                    )}
                                    {selectedDeclaration.personDetails.contactInfo && (
                                        <p><strong>Contact d'urgence:</strong> {selectedDeclaration.personDetails.contactInfo}</p>
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
                                    <button 
                                        onClick={async () => {
                                            try {
                                                // Créer un élément temporaire pour le contenu du récépissé
                                                const receiptElement = document.createElement('div');
                                                receiptElement.style.width = '210mm';
                                                receiptElement.style.padding = '20mm';
                                                receiptElement.style.backgroundColor = 'white';
                                                receiptElement.style.fontFamily = 'Arial, sans-serif';
                                                receiptElement.style.position = 'absolute';
                                                receiptElement.style.left = '-9999px';
                                                receiptElement.innerHTML = `
                                                    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
                                                        <h1 style="font-size: 24px; margin-bottom: 10px;">Récépissé Officiel de Déclaration de Perte</h1>
                                                        <p style="font-size: 16px;">N° ${selectedDeclaration.receiptNumber}</p>
                                                        <p style="font-size: 16px;">Date d'émission: ${dayjs(selectedDeclaration.receiptDate).format('DD MMMM YYYY')}</p>
                                                    </div>
                                                    
                                                    <div style="margin-bottom: 30px;">
                                                        <h2 style="font-size: 20px; margin-bottom: 15px;">Informations de la Déclaration</h2>
                                                        <p style="font-size: 14px; margin: 5px 0;"><strong>Type de déclaration:</strong> ${selectedDeclaration.declarationType === 'objet' ? 'Perte d\'objet' : 'Disparition de personne'}</p>
                                                        <p style="font-size: 14px; margin: 5px 0;"><strong>Date de la déclaration:</strong> ${dayjs(selectedDeclaration.declarationDate).format('DD MMMM YYYY à HH:mm')}</p>
                                                        <p style="font-size: 14px; margin: 5px 0;"><strong>Lieu de la perte:</strong> ${selectedDeclaration.location}</p>
                                                        
                                                        ${selectedDeclaration.declarationType === 'objet' ? `
                                                            <h3 style="font-size: 18px; margin: 15px 0;">Détails de l'objet perdu</h3>
                                                            <p style="font-size: 14px; margin: 5px 0;"><strong>Catégorie:</strong> ${selectedDeclaration.objectDetails?.objectCategory || 'Non spécifiée'}</p>
                                                            <p style="font-size: 14px; margin: 5px 0;"><strong>Nom:</strong> ${selectedDeclaration.objectDetails?.objectName || 'Non spécifié'}</p>
                                                            ${selectedDeclaration.objectDetails?.objectBrand ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Marque:</strong> ${selectedDeclaration.objectDetails.objectBrand}</p>` : ''}
                                                            ${selectedDeclaration.objectDetails?.color ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Couleur:</strong> ${selectedDeclaration.objectDetails.color}</p>` : ''}
                                                            ${selectedDeclaration.objectDetails?.serialNumber ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Numéro de série:</strong> ${selectedDeclaration.objectDetails.serialNumber}</p>` : ''}
                                                            ${selectedDeclaration.objectDetails?.estimatedValue ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Valeur estimée:</strong> ${selectedDeclaration.objectDetails.estimatedValue} €</p>` : ''}
                                                            ${selectedDeclaration.objectDetails?.identificationMarks ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Signes particuliers:</strong> ${selectedDeclaration.objectDetails.identificationMarks}</p>` : ''}
                                                        ` : ''}
                                                        
                                                        ${selectedDeclaration.declarationType === 'personne' && selectedDeclaration.personDetails ? `
                                                            <h3 style="font-size: 18px; margin: 15px 0;">Détails de la personne disparue</h3>
                                                            <p style="font-size: 14px; margin: 5px 0;"><strong>Nom:</strong> ${selectedDeclaration.personDetails.lastName}</p>
                                                            <p style="font-size: 14px; margin: 5px 0;"><strong>Prénom:</strong> ${selectedDeclaration.personDetails.firstName}</p>
                                                            <p style="font-size: 14px; margin: 5px 0;"><strong>Date de naissance:</strong> ${dayjs(selectedDeclaration.personDetails.dateOfBirth).format('DD MMMM YYYY')}</p>
                                                            <p style="font-size: 14px; margin: 5px 0;"><strong>Âge:</strong> ${selectedDeclaration.personDetails.age} ans</p>
                                                            <p style="font-size: 14px; margin: 5px 0;"><strong>Genre:</strong> ${selectedDeclaration.personDetails.gender}</p>
                                                            ${selectedDeclaration.personDetails.height ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Taille:</strong> ${selectedDeclaration.personDetails.height} cm</p>` : ''}
                                                            ${selectedDeclaration.personDetails.weight ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Poids:</strong> ${selectedDeclaration.personDetails.weight} kg</p>` : ''}
                                                            ${selectedDeclaration.personDetails.clothing ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Vêtements:</strong> ${selectedDeclaration.personDetails.clothing}</p>` : ''}
                                                            ${selectedDeclaration.personDetails.lastSeenLocation ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Dernier lieu vu:</strong> ${selectedDeclaration.personDetails.lastSeenLocation}</p>` : ''}
                                                            ${selectedDeclaration.personDetails.lastSeenDate ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Dernière date de vue:</strong> ${dayjs(selectedDeclaration.personDetails.lastSeenDate).format('DD MMMM YYYY à HH:mm')}</p>` : ''}
                                                            ${selectedDeclaration.personDetails.medicalConditions ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Conditions médicales:</strong> ${selectedDeclaration.personDetails.medicalConditions}</p>` : ''}
                                                            ${selectedDeclaration.personDetails.contactInfo ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Contact d'urgence:</strong> ${selectedDeclaration.personDetails.contactInfo}</p>` : ''}
                                                        ` : ''}
                                                        
                                                        <h3 style="font-size: 18px; margin: 15px 0;">Description détaillée</h3>
                                                        <p style="font-size: 14px; margin: 5px 0;">${selectedDeclaration.description}</p>
                                                    </div>
                                                    
                                                    <div style="margin-top: 50px; border-top: 1px solid #000; padding-top: 20px;">
                                                        <p style="font-size: 14px; margin: 5px 0;"><strong>Commissariat:</strong> ${selectedDeclaration.commissariat?.name || 'Non assigné'}</p>
                                                        <p style="font-size: 14px; margin: 5px 0;"><strong>Adresse du commissariat:</strong> ${selectedDeclaration.commissariat?.address || 'Non disponible'}</p>
                                                        <p style="font-size: 14px; margin: 5px 0;"><strong>Téléphone:</strong> ${selectedDeclaration.commissariat?.phone || 'Non disponible'}</p>
                                                        
                                                        <div style="margin-top: 50px;">
                                                            <p style="font-size: 14px; margin: 5px 0;">Signature et cachet du commissariat</p>
                                                            <div style="border-top: 1px solid #000; width: 200px; margin-top: 50px;"></div>
                                                        </div>
                                                    </div>
                                                `;

                                                // Ajouter l'élément au document
                                                document.body.appendChild(receiptElement);

                                                // Convertir en canvas puis en PDF
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
                                                pdf.save(`recepisse_officiel_${selectedDeclaration.receiptNumber}.pdf`);

                                                // Nettoyer
                                                document.body.removeChild(receiptElement);
                                            } catch (error) {
                                                console.error('Erreur lors de la génération du PDF:', error);
                                                toast.error('Erreur lors de la génération du PDF');
                                            }
                                        }}
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