// backend/models/Declaration.js
import mongoose from 'mongoose';

const DeclarationSchema = mongoose.Schema({
    // Informations communes
    user: { // L'utilisateur qui a fait la déclaration
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    declarationType: { // 'objet' ou 'personne'
        type: String,
        enum: ['objet', 'personne'],
        required: [true, 'Please specify the type of declaration (object or person)'],
    },
    declarationDate: { // Date de la perte/disparition
        type: Date,
        required: [true, 'Please add the date of loss/disappearance']
    },
    location: { // Lieu de la perte/disparition
        type: String,
        required: [true, 'Please add the location of loss/disappearance'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a detailed description'],
        trim: true
    },
    photos: [String], // Tableau d'URLs des photos (si applicable)

    // Informations spécifiques aux objets
    objectDetails: {
        objectName: String,
        objectCategory: String, // ex: 'téléphone', 'documents', 'bijoux', 'véhicule'
        objectBrand: String,
        objectModel: String,
        serialNumber: String, // Numéro de série (si applicable)
        color: String,
        estimatedValue: Number, // Valeur estimée de l'objet
    },

    // Informations spécifiques aux personnes
    personDetails: {
        firstName: String,
        lastName: String,
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ['Masculin', 'Féminin', 'Autre']
        },
        height: Number, // en cm
        weight: Number, // en kg
        hairColor: String,
        eyeColor: String,
        clothingDescription: String, // Description des vêtements portés
        lastSeenLocation: String,
        distinguishingMarks: String, // Marques distinctives (cicatrices, tatouages)
    },

    // Informations de traitement par le commissariat
    status: {
        type: String,
        enum: ['En attente', 'Traité', 'Refusée'],
        default: 'En attente'
    },
    rejectReason: {
        type: String,
        trim: true
    },
    commissariat: { // Le commissariat assigné à cette déclaration
        type: mongoose.Schema.ObjectId,
        ref: 'Commissariat',
        required: true // Chaque déclaration doit être rattachée à un commissariat
    },
    agentAssigned: { // L'agent de commissariat assigné
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    receiptNumber: String, // Numéro de récépissé généré par le commissariat
    receiptUrl: String,   // URL du PDF du récépissé
    notes: String,        // Notes ajoutées par l'agent de commissariat
    processedAt: Date,    // Date de traitement par le commissariat

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Declaration = mongoose.model('Declaration', DeclarationSchema);

export default Declaration;