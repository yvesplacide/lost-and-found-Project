// backend/controllers/declarationController.js
import asyncHandler from 'express-async-handler';
import Declaration from '../models/Declaration.js';
import User from '../models/User.js'; // Pour vérifier l'existence de l'utilisateur
import Commissariat from '../models/Commissariat.js'; // Pour assigner la déclaration à un commissariat
import ROLES from '../config/roles.js';

// @desc    Create a new declaration
// @route   POST /api/declarations
// @access  Private (User Only)
const createDeclaration = asyncHandler(async (req, res) => {
    const { declarationType, declarationDate, location, description, objectDetails, personDetails, commissariatId } = req.body;

    // L'ID de l'utilisateur est extrait de `req.user` via le middleware `protect`
    const userId = req.user._id;

    // Vérifier si tous les champs requis pour le type de déclaration sont présents
    if (!declarationType || !declarationDate || !location || !description || !commissariatId) {
        res.status(400);
        throw new Error('Please fill all required common fields and provide a commissariat ID');
    }

    // Valider le commissariatId
    const commissariat = await Commissariat.findById(commissariatId);
    if (!commissariat) {
        res.status(404);
        throw new Error('Commissariat not found');
    }

    // Préparer les données spécifiques au type de déclaration
    let specificDetails = {};
    if (declarationType === 'objet') {
        if (!objectDetails || !objectDetails.objectName || !objectDetails.objectCategory) {
            res.status(400);
            throw new Error('Please provide object name and category for object declaration');
        }
        specificDetails = { objectDetails };
    } else if (declarationType === 'personne') {
        if (!personDetails || !personDetails.firstName || !personDetails.lastName || !personDetails.dateOfBirth) {
            res.status(400);
            throw new Error('Please provide first name, last name and date of birth for person declaration');
        }
        specificDetails = { personDetails };
    } else {
        res.status(400);
        throw new Error('Invalid declaration type. Must be "objet" or "personne"');
    }

    // Gérer l'upload de photos si présent (express-fileupload place les fichiers dans req.files)
    let photoUrls = [];
    if (req.files && req.files.photos) {
        const photosArray = Array.isArray(req.files.photos) ? req.files.photos : [req.files.photos];
        // Pour un vrai projet, vous stockeriez ces fichiers sur un service de stockage cloud (AWS S3, Cloudinary)
        // ou dans un dossier public et enregistreriez leurs chemins.
        // Pour l'instant, nous allons simuler un chemin ou un nom de fichier.
        // Exemple très simple :
        photosArray.forEach(photo => {
            const fileName = `${Date.now()}-${photo.name}`;
            const uploadPath = `./uploads/${fileName}`; // Assurez-vous que le dossier 'uploads' existe
            photo.mv(uploadPath, (err) => {
                if (err) {
                    console.error('File upload error:', err);
                    // Ne pas renvoyer d'erreur fatale pour le moment, mais loguer
                }
            });
            photoUrls.push(`/uploads/${fileName}`); // Sauvegarder l'URL relative
        });
    }

    const declaration = await Declaration.create({
        user: userId,
        commissariat: commissariatId,
        declarationType,
        declarationDate,
        location,
        description,
        photos: photoUrls,
        ...specificDetails, // Spread des détails spécifiques (objectDetails ou personDetails)
        status: 'En attente' // Statut initial
    });

    res.status(201).json(declaration);
});

// @desc    Get all declarations for the logged-in user
// @route   GET /api/declarations/my-declarations
// @access  Private (User Only)
const getMyDeclarations = asyncHandler(async (req, res) => {
    // Récupérer uniquement les déclarations de l'utilisateur connecté
    const declarations = await Declaration.find({ user: req.user._id })
        .populate('commissariat', 'name address city phone email') // Populater les infos du commissariat
        .select('-__v'); // Exclure le champ __v de Mongoose

    res.status(200).json(declarations);
});

// @desc    Get all declarations (for Commissariat agents and Admin)
// @route   GET /api/declarations
// @access  Private (Commissariat_Agent, Admin)
const getAllDeclarations = asyncHandler(async (req, res) => {
    let query = {};

    // Si c'est un agent de commissariat, ne montrer que les déclarations de son commissariat
    if (req.user.role === ROLES.COMMISSARIAT_AGENT) {
        // Supposons que l'agent est lié à un commissariat.
        // Pour l'instant, l'agent n'a pas de commissariat assigné directement dans le modèle User.
        // C'est un point à améliorer ou à définir : comment un agent est-il associé à un commissariat ?
        // Pour cette démo, on peut temporairement laisser l'agent voir toutes les déclarations,
        // ou ajouter un champ `commissariat` au modèle `User` pour les agents.
        // Pour l'instant, nous allons laisser l'agent voir toutes les déclarations pour simplifier,
        // mais le rôle `authorize` ci-dessous gérera cela.
        // Une approche plus robuste serait : `query.commissariat = req.user.commissariatId;`
        // où req.user.commissariatId serait défini lors de la connexion de l'agent
        // ou via un champ dans le modèle User pour les agents.
    }

    const declarations = await Declaration.find(query)
        .populate('user', 'firstName lastName email phone') // Populater l'utilisateur déclarant
        .populate('commissariat', 'name address city phone email') // Populater le commissariat
        .populate('agentAssigned', 'firstName lastName email') // Populater l'agent assigné si existant
        .select('-__v');

    res.status(200).json(declarations);
});

// @desc    Get single declaration by ID
// @route   GET /api/declarations/:id
// @access  Private (User, Commissariat_Agent, Admin)
const getDeclarationById = asyncHandler(async (req, res) => {
    const declaration = await Declaration.findById(req.params.id)
        .populate('user', 'firstName lastName email phone')
        .populate('commissariat', 'name address city phone email')
        .populate('agentAssigned', 'firstName lastName email')
        .select('-__v');

    if (!declaration) {
        res.status(404);
        throw new Error('Declaration not found');
    }

    // Assurer que seul le déclarant, l'agent du commissariat concerné ou l'admin peut voir la déclaration
    if (req.user.role === ROLES.USER && declaration.user.toString() !== req.user._id.toString()) {
        res.status(403); // Forbidden
        throw new Error('Not authorized to view this declaration');
    }

    // Pour un agent de commissariat, vérifier qu'il appartient au commissariat de la déclaration
    // Ceci nécessite que l'agent de commissariat soit lié à un commissariat.
    // Pour l'instant, nous allons laisser passer pour l'agent si l'agent est dans le rôle.
    // Une solution plus robuste serait :
    // if (req.user.role === ROLES.COMMISSARIAT_AGENT && req.user.commissariatId.toString() !== declaration.commissariat._id.toString()) {
    //    res.status(403);
    //    throw new Error('Not authorized to view declarations from other commissariats');
    // }

    res.status(200).json(declaration);
});

// @desc    Update declaration status and assign agent (Commissariat Agent, Admin)
// @route   PUT /api/declarations/:id/status
// @access  Private (Commissariat_Agent, Admin)
const updateDeclarationStatus = asyncHandler(async (req, res) => {
    const { status, agentAssignedId, receiptNumber, receiptUrl, notes } = req.body;

    const declaration = await Declaration.findById(req.params.id);

    if (!declaration) {
        res.status(404);
        throw new Error('Declaration not found');
    }

    // Vérifier si l'utilisateur est un agent du commissariat concerné ou un admin
    if (req.user.role === ROLES.COMMISSARIAT_AGENT && declaration.commissariat.toString() !== req.user.commissariatId.toString()) {
        // Cette ligne nécessite que req.user.commissariatId soit défini pour l'agent
        // Pour l'instant, si l'agent est en rôle, il peut modifier.
        res.status(403);
        throw new Error('Not authorized to update declarations for other commissariats');
    }


    // Mettre à jour les champs si fournis
    if (status) {
        if (!['En attente', 'En cours de traitement', 'Traitée', 'Clôturée'].includes(status)) {
            res.status(400);
            throw new Error('Invalid status value');
        }
        declaration.status = status;
    }
    if (agentAssignedId) {
        const agent = await User.findById(agentAssignedId);
        if (!agent || agent.role !== ROLES.COMMISSARIAT_AGENT) {
            res.status(400);
            throw new Error('Invalid agent ID or not a commissariat agent');
        }
        declaration.agentAssigned = agentAssignedId;
    }
    if (receiptNumber) {
        declaration.receiptNumber = receiptNumber;
    }
    if (receiptUrl) {
        declaration.receiptUrl = receiptUrl;
    }
    if (notes) {
        declaration.notes = notes;
    }
    declaration.processedAt = Date.now(); // Mettre à jour la date de traitement

    const updatedDeclaration = await declaration.save();

    res.status(200).json(updatedDeclaration);
});

// @desc    Delete a declaration (Admin only, or User can delete their own if status is 'En attente')
// @route   DELETE /api/declarations/:id
// @access  Private (User for own, Admin)
const deleteDeclaration = asyncHandler(async (req, res) => {
    const declaration = await Declaration.findById(req.params.id);

    if (!declaration) {
        res.status(404);
        throw new Error('Declaration not found');
    }

    // Vérifier les autorisations
    if (req.user.role === ROLES.ADMIN) {
        // L'administrateur peut supprimer n'importe quelle déclaration
        await declaration.deleteOne(); // Utiliser deleteOne() ou remove() pour Mongoose 6+
        res.status(200).json({ message: 'Declaration removed' });
    } else if (req.user.role === ROLES.USER && declaration.user.toString() === req.user._id.toString()) {
        // L'utilisateur peut supprimer sa propre déclaration si elle est 'En attente'
        if (declaration.status === 'En attente') {
            await declaration.deleteOne();
            res.status(200).json({ message: 'Your declaration removed' });
        } else {
            res.status(403);
            throw new Error('Cannot delete declaration unless status is "En attente"');
        }
    } else {
        res.status(403); // Forbidden
        throw new Error('Not authorized to delete this declaration');
    }
});


export {
    createDeclaration,
    getMyDeclarations,
    getAllDeclarations,
    getDeclarationById,
    updateDeclarationStatus,
    deleteDeclaration
};