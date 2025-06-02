// frontend/src/components/declaration/DeclarationForm.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../services/api'; // Pour récupérer la liste des commissariats
import dayjs from 'dayjs'; // Pour gérer les dates

function DeclarationForm({ onSubmitSuccess }) {
    const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm();
    const declarationType = watch('declarationType'); // Observe le type de déclaration pour afficher les champs conditionnels
    const [commissariats, setCommissariats] = useState([]);
    const [loadingCommissariats, setLoadingCommissariats] = useState(true);

    useEffect(() => {
        // Charger la liste des commissariats au montage du composant
        const fetchCommissariats = async () => {
            try {
                const response = await api.get('/commissariats');
                setCommissariats(response.data);
            } catch (error) {
                toast.error('Erreur lors du chargement des commissariats.');
                console.error('Erreur fetching commissariats:', error);
            } finally {
                setLoadingCommissariats(false);
            }
        };
        fetchCommissariats();
    }, []);

    const onSubmit = async (data) => {
        try {
            // Ajuster la date pour correspondre au format attendu par le backend (ISO 8601)
            data.declarationDate = dayjs(data.declarationDate).toISOString();

            // Créer un FormData pour l'upload de fichiers et les autres champs
            const formData = new FormData();
            for (const key in data) {
                if (key === 'photos' && data[key] && data[key].length > 0) {
                    // Ajouter chaque fichier individuellement
                    for (let i = 0; i < data[key].length; i++) {
                        formData.append('photos', data[key][i]);
                    }
                } else if (typeof data[key] === 'object' && data[key] !== null) {
                    // Pour les objets imbriqués comme objectDetails ou personDetails, stringifier
                    formData.append(key, JSON.stringify(data[key]));
                } else {
                    formData.append(key, data[key]);
                }
            }
            
            // Corriger l'envoi des détails spécifiques comme objet JSON stringifié
            if (declarationType === 'objet' && data.objectDetails) {
                formData.set('objectDetails', JSON.stringify(data.objectDetails));
            } else if (declarationType === 'personne' && data.personDetails) {
                formData.set('personDetails', JSON.stringify(data.personDetails));
            }

            // Changer le Content-Type pour les requêtes FormData
            const response = await api.post('/declarations', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success('Déclaration soumise avec succès !');
            reset(); // Réinitialise le formulaire
            if (onSubmitSuccess) {
                onSubmitSuccess(response.data); // Passe la nouvelle déclaration au parent
            }
        } catch (error) {
            console.error('Erreur lors de la soumission de la déclaration:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de la soumission de la déclaration.');
        }
    };

    return (
        <div className="declaration-form-container">
            <h3>Faire une nouvelle déclaration</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="declaration-form">
                <div className="form-group">
                    <label htmlFor="declarationType">Type de déclaration</label>
                    <select
                        id="declarationType"
                        {...register('declarationType', { required: 'Le type de déclaration est requis' })}
                        defaultValue=""
                        className="form-control"
                    >
                        <option value="">Sélectionner un type</option>
                        <option value="objet">Perte d'objet</option>
                        <option value="personne">Perte de personne</option>
                    </select>
                    {errors.declarationType && <span className="error-message">{errors.declarationType.message}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="declarationDate">Date de la perte/disparition</label>
                    <input
                        type="datetime-local"
                        id="declarationDate"
                        {...register('declarationDate', { required: 'La date est requise' })}
                        max={dayjs().format('YYYY-MM-DDTHH:mm')}
                        className="form-control"
                    />
                    {errors.declarationDate && <span className="error-message">{errors.declarationDate.message}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="location">Lieu de la perte/disparition</label>
                    <input
                        type="text"
                        id="location"
                        {...register('location', { required: 'Le lieu est requis' })}
                        className="form-control"
                        placeholder="Entrez le lieu de la perte/disparition"
                    />
                    {errors.location && <span className="error-message">{errors.location.message}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description détaillée</label>
                    <textarea
                        id="description"
                        rows="5"
                        {...register('description', { required: 'La description est requise', minLength: { value: 20, message: 'La description doit contenir au moins 20 caractères' } })}
                        className="form-control"
                        placeholder="Décrivez en détail la perte ou la disparition..."
                    ></textarea>
                    {errors.description && <span className="error-message">{errors.description.message}</span>}
                </div>

                {/* Champs conditionnels basés sur le type de déclaration */}
                {declarationType === 'objet' && (
                    <div className="object-details">
                        <h4>Détails de l'objet</h4>
                        <div className="form-group">
                            <label htmlFor="objectDetails.objectCategory">Catégorie</label>
                            <select
                                id="objectDetails.objectCategory"
                                {...register('objectDetails.objectCategory', { required: 'La catégorie est requise' })}
                                className="form-control"
                            >
                                <option value="">Sélectionner une catégorie</option>
                                <optgroup label="Documents administratifs">
                                    <option value="cni">Carte Nationale d'Identité (CNI)</option>
                                    <option value="passeport">Passeport</option>
                                    <option value="certificat_nationalite">Certificat de nationalité</option>
                                    <option value="acte_naissance">Acte de naissance</option>
                                    <option value="carte_electeur">Carte d'électeur</option>
                                    <option value="permis_conduire">Permis de conduire</option>
                                    <option value="carte_consulaire">Carte consulaire</option>
                                    <option value="casier_judiciaire">Extrait de casier judiciaire</option>
                                </optgroup>
                                <optgroup label="Documents professionnels / scolaires">
                                    <option value="carte_professionnelle">Carte professionnelle</option>
                                    <option value="carte_etudiant">Carte d'étudiant ou scolaire</option>
                                    <option value="diplomes">Diplômes ou relevés de notes</option>
                                    <option value="ordre_mission">Ordres de mission</option>
                                </optgroup>
                                <optgroup label="Documents bancaires / financiers">
                                    <option value="carte_bancaire">Carte bancaire</option>
                                    <option value="carnet_cheques">Carnet de chèques</option>
                                    <option value="bordereaux">Bordereaux de dépôt ou de retrait</option>
                                    <option value="recus_transfert">Reçus de transfert d'argent</option>
                                </optgroup>
                                <optgroup label="Objets personnels">
                                    <option value="telephone">Téléphone portable</option>
                                    <option value="sac">Sac ou sac à main</option>
                                    <option value="cles">Clés (de maison, de voiture, etc.)</option>
                                    <option value="ordinateur">Ordinateur portable</option>
                                    <option value="montre_bijoux">Montre ou bijoux de valeur</option>
                                </optgroup>
                                <optgroup label="Véhicules">
                                    <option value="carte_grise">Carte grise (certificat d'immatriculation)</option>
                                    <option value="assurance_vehicule">Assurance véhicule</option>
                                    <option value="plaque_immatriculation">Plaque d'immatriculation</option>
                                </optgroup>
                                <optgroup label="Autres objets ou documents">
                                    <option value="badge_acces">Badge d'accès (entreprise, résidence)</option>
                                    <option value="carnet_sante">Carnet de santé</option>
                                    <option value="certificat_travail">Certificat de travail</option>
                                    <option value="contrat">Contrat de bail ou d'assurance</option>
                                </optgroup>
                            </select>
                            {errors.objectDetails?.objectCategory && <span className="error-message">{errors.objectDetails.objectCategory.message}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="objectDetails.objectName">Nom spécifique de l'objet</label>
                            <input
                                type="text"
                                id="objectDetails.objectName"
                                {...register('objectDetails.objectName', { required: 'Le nom de l\'objet est requis' })}
                                className="form-control"
                                placeholder="Ex: iPhone 13, Sac à dos Nike, etc."
                            />
                            {errors.objectDetails?.objectName && <span className="error-message">{errors.objectDetails.objectName.message}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="objectDetails.objectBrand">Marque (optionnel)</label>
                            <input
                                type="text"
                                id="objectDetails.objectBrand"
                                {...register('objectDetails.objectBrand')}
                                className="form-control"
                                placeholder="Ex: Apple, Samsung, Nike, etc."
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="objectDetails.color">Couleur (optionnel)</label>
                            <input
                                type="text"
                                id="objectDetails.color"
                                {...register('objectDetails.color')}
                                className="form-control"
                                placeholder="Ex: Noir, Rouge, etc."
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="objectDetails.serialNumber">Numéro de série ou référence (optionnel)</label>
                            <input
                                type="text"
                                id="objectDetails.serialNumber"
                                {...register('objectDetails.serialNumber')}
                                className="form-control"
                                placeholder="Ex: Numéro de série, référence du document, etc."
                            />
                        </div>
                    </div>
                )}

                {declarationType === 'personne' && (
                    <div className="person-details">
                        <h4>Détails de la personne disparue</h4>
                        <div className="form-group">
                            <label htmlFor="personDetails.firstName">Prénom</label>
                            <input
                                type="text"
                                id="personDetails.firstName"
                                {...register('personDetails.firstName', { required: 'Le prénom est requis' })}
                            />
                            {errors.personDetails?.firstName && <span className="error-message">{errors.personDetails.firstName.message}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="personDetails.lastName">Nom</label>
                            <input
                                type="text"
                                id="personDetails.lastName"
                                {...register('personDetails.lastName', { required: 'Le nom est requis' })}
                            />
                            {errors.personDetails?.lastName && <span className="error-message">{errors.personDetails.lastName.message}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="personDetails.dateOfBirth">Date de naissance</label>
                            <input
                                type="date"
                                id="personDetails.dateOfBirth"
                                {...register('personDetails.dateOfBirth', { required: 'La date de naissance est requise' })}
                                max={dayjs().format('YYYY-MM-DD')} // Empêche les dates de naissance futures
                            />
                            {errors.personDetails?.dateOfBirth && <span className="error-message">{errors.personDetails.dateOfBirth.message}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="personDetails.lastSeenLocation">Dernier lieu vu (optionnel)</label>
                            <input
                                type="text"
                                id="personDetails.lastSeenLocation"
                                {...register('personDetails.lastSeenLocation')}
                            />
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="commissariat">Commissariat</label>
                    <select
                        id="commissariat"
                        {...register('commissariat', { required: 'Le commissariat est requis' })}
                        disabled={loadingCommissariats}
                    >
                        <option value="">Sélectionner un commissariat</option>
                        {commissariats.map((commissariat) => (
                            <option key={commissariat._id} value={commissariat._id}>
                                {commissariat.name} - {commissariat.city}
                            </option>
                        ))}
                    </select>
                    {errors.commissariat && <span className="error-message">{errors.commissariat.message}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="photos">Photos (optionnel)</label>
                    <input
                        type="file"
                        id="photos"
                        multiple
                        accept="image/*"
                        {...register('photos')}
                    />
                    {errors.photos && <span className="error-message">{errors.photos.message}</span>}
                </div>

                <button type="submit" className="btn primary-btn">Soumettre la déclaration</button>
            </form>
        </div>
    );
}

export default DeclarationForm;