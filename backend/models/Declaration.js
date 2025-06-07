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
        firstName: {
            type: String,
            required: function() {
                return this.declarationType === 'personne';
            },
            validate: {
                validator: function(v) {
                    return this.declarationType !== 'personne' || (v && v.trim().length > 0);
                },
                message: 'Le prénom est requis pour une déclaration de personne'
            }
        },
        lastName: {
            type: String,
            required: function() {
                return this.declarationType === 'personne';
            },
            validate: {
                validator: function(v) {
                    return this.declarationType !== 'personne' || (v && v.trim().length > 0);
                },
                message: 'Le nom est requis pour une déclaration de personne'
            }
        },
        dateOfBirth: {
            type: Date,
            required: function() {
                return this.declarationType === 'personne';
            },
            validate: {
                validator: function(v) {
                    return this.declarationType !== 'personne' || v;
                },
                message: 'La date de naissance est requise pour une déclaration de personne'
            }
        },
        gender: {
            type: String,
            enum: ['Masculin', 'Féminin', 'Autre'],
            required: function() {
                return this.declarationType === 'personne';
            },
            validate: {
                validator: function(v) {
                    return this.declarationType !== 'personne' || v;
                },
                message: 'Le genre est requis pour une déclaration de personne'
            }
        },
        height: {
            type: Number,
            required: function() {
                return this.declarationType === 'personne';
            },
            validate: {
                validator: function(v) {
                    return this.declarationType !== 'personne' || v;
                },
                message: 'La taille est requise pour une déclaration de personne'
            }
        },
        weight: {
            type: Number,
            required: function() {
                return this.declarationType === 'personne';
            },
            validate: {
                validator: function(v) {
                    return this.declarationType !== 'personne' || v;
                },
                message: 'Le poids est requis pour une déclaration de personne'
            }
        },
        clothingDescription: {
            type: String,
            required: function() {
                return this.declarationType === 'personne';
            },
            validate: {
                validator: function(v) {
                    return this.declarationType !== 'personne' || (v && v.trim().length > 0);
                },
                message: 'La description des vêtements est requise pour une déclaration de personne'
            }
        },
        lastSeenLocation: {
            type: String,
            required: function() {
                return this.declarationType === 'personne';
            },
            validate: {
                validator: function(v) {
                    return this.declarationType !== 'personne' || (v && v.trim().length > 0);
                },
                message: 'Le dernier lieu vu est requis pour une déclaration de personne'
            }
        },
        distinguishingMarks: String,
        medicalConditions: String,
        contactInfo: String
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
    },
    isDeletedByUser: {
        type: Boolean,
        default: false
    }
});

const Declaration = mongoose.model('Declaration', DeclarationSchema);

export default Declaration;