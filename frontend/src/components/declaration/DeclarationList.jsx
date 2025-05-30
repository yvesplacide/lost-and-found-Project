// frontend/src/components/declaration/DeclarationList.jsx
import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr'; // Importer la locale française pour dayjs
dayjs.locale('fr');

function DeclarationList({ declarations, onDelete }) {
    if (!declarations || declarations.length === 0) {
        return <p>Vous n'avez pas encore de déclarations.</p>;
    }

    return (
        <div className="declaration-list-container">
            <h3>Vos Déclarations</h3>
            <div className="declaration-cards">
                {declarations.map((declaration) => (
                    <div key={declaration._id} className="declaration-card">
                        <h4>Déclaration de {declaration.declarationType === 'objet' ? 'perte d\'objet' : 'disparition de personne'}</h4>
                        <p><strong>N° de déclaration:</strong> {declaration.receiptNumber || 'N/A'}</p>
                        <p><strong>Statut:</strong> <span className={`status-${declaration.status.toLowerCase().replace(/\s/g, '-')}`}>{declaration.status}</span></p>
                        <p><strong>Date:</strong> {dayjs(declaration.declarationDate).format('DD MMMM YYYY à HH:mm')}</p>
                        <p><strong>Lieu:</strong> {declaration.location}</p>
                        <p><strong>Description:</strong> {declaration.description}</p>

                        {declaration.declarationType === 'objet' && declaration.objectDetails && (
                            <div className="details-section">
                                <h5>Détails de l'objet:</h5>
                                <p>Nom: {declaration.objectDetails.objectName}</p>
                                <p>Catégorie: {declaration.objectDetails.objectCategory}</p>
                                {declaration.objectDetails.objectBrand && <p>Marque: {declaration.objectDetails.objectBrand}</p>}
                                {declaration.objectDetails.color && <p>Couleur: {declaration.objectDetails.color}</p>}
                            </div>
                        )}

                        {declaration.declarationType === 'personne' && declaration.personDetails && (
                            <div className="details-section">
                                <h5>Détails de la personne:</h5>
                                <p>Nom: {declaration.personDetails.lastName}, Prénom: {declaration.personDetails.firstName}</p>
                                <p>Date de naissance: {dayjs(declaration.personDetails.dateOfBirth).format('DD MMMM YYYY')}</p>
                                {declaration.personDetails.lastSeenLocation && <p>Dernier lieu vu: {declaration.personDetails.lastSeenLocation}</p>}
                            </div>
                        )}

                        {declaration.commissariat && (
                            <div className="details-section">
                                <h5>Commissariat:</h5>
                                <p>{declaration.commissariat.name} ({declaration.commissariat.city})</p>
                                <p>Contact: {declaration.commissariat.phone}</p>
                            </div>
                        )}

                        {declaration.photos && declaration.photos.length > 0 && (
                            <div className="photos-section">
                                <h5>Photos:</h5>
                                <div className="photo-grid">
                                    {declaration.photos.map((photoUrl, index) => (
                                        <img key={index} src={`http://localhost:5000${photoUrl}`} alt={`Photo ${index + 1}`} className="declaration-photo" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bouton de suppression conditionnel */}
                        {declaration.status === 'En attente' && onDelete && (
                            <button onClick={() => onDelete(declaration._id)} className="btn delete-btn">Supprimer la déclaration</button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DeclarationList;