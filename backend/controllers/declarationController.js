// backend/controllers/declarationController.js
import Declaration from '../models/Declaration.js';
import asyncHandler from 'express-async-handler';
import Commissariat from '../models/Commissariat.js';

// @desc    Créer une nouvelle déclaration
// @route   POST /api/declarations
// @access  Private/User
export const createDeclaration = asyncHandler(async (req, res) => {
    try {
        console.log('Début de la création de déclaration');
        console.log('Données reçues:', req.body);
        console.log('Fichiers reçus:', req.files);

        // Vérifier si un commissariat a été sélectionné
        if (!req.body.commissariat) {
            console.log('Erreur: Commissariat non sélectionné');
            res.status(400);
            throw new Error('Veuillez sélectionner un commissariat');
        }

        // Vérifier si le commissariat existe
        const commissariat = await Commissariat.findById(req.body.commissariat);
        if (!commissariat) {
            console.log('Erreur: Commissariat non trouvé avec ID:', req.body.commissariat);
            res.status(404);
            throw new Error('Commissariat non trouvé');
        }

        // Préparer les données de la déclaration
        const declarationData = {
            ...req.body,
            user: req.user._id,
            status: 'En attente',
            createdAt: new Date()
        };

        // Gérer les photos si présentes
        if (req.files && req.files.length > 0) {
            try {
                console.log('Traitement des photos...');
                declarationData.photos = req.files.map(file => file.filename);
                console.log('Photos sauvegardées:', declarationData.photos);
            } catch (uploadError) {
                console.error('Erreur détaillée lors de l\'upload des photos:', uploadError);
                res.status(400);
                throw new Error('Erreur lors de l\'upload des photos. Veuillez réessayer.');
            }
        }

        // Créer la déclaration
        console.log('Création de la déclaration dans la base de données...');
        const declaration = await Declaration.create(declarationData);
        console.log('Déclaration créée avec succès:', declaration._id);

        // Populer les références pour la réponse
        const populatedDeclaration = await Declaration.findById(declaration._id)
            .populate('user', 'firstName lastName email')
            .populate('commissariat', 'name city');

        console.log('Déclaration peuplée avec succès');
        res.status(201).json(populatedDeclaration);
    } catch (error) {
        console.error('Erreur détaillée lors de la création de la déclaration:', error);
        if (error.name === 'ValidationError') {
            console.log('Erreur de validation:', error.message);
            res.status(400);
            throw new Error('Données de déclaration invalides: ' + error.message);
        }
        res.status(500);
        throw new Error(error.message || 'Erreur lors de la création de la déclaration');
    }
});

// @desc    Obtenir toutes les déclarations
// @route   GET /api/declarations
// @access  Private/Admin
export const getDeclarations = asyncHandler(async (req, res) => {
    const declarations = await Declaration.find({})
        .populate('user', 'firstName lastName email')
        .populate('commissariat', 'name city');
    res.json(declarations);
});

// @desc    Obtenir les déclarations de l'utilisateur connecté
// @route   GET /api/declarations/my-declarations
// @access  Private/User
export const getMyDeclarations = asyncHandler(async (req, res) => {
    const declarations = await Declaration.find({ user: req.user._id })
        .populate('commissariat', 'name city');
    res.json(declarations);
});

// @desc    Obtenir une déclaration par ID
// @route   GET /api/declarations/:id
// @access  Private
export const getDeclarationById = asyncHandler(async (req, res) => {
    const declaration = await Declaration.findById(req.params.id)
        .populate('user', 'firstName lastName email')
        .populate('commissariat', 'name city');

    if (!declaration) {
        res.status(404);
        throw new Error('Déclaration non trouvée');
    }

    // Vérifier si l'utilisateur est le propriétaire, un agent ou un admin
    if (declaration.user._id.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin' && 
        req.user.role !== 'commissariat_agent') {
        res.status(403);
        throw new Error('Non autorisé à accéder à cette déclaration');
    }

    res.json(declaration);
});

// @desc    Mettre à jour une déclaration
// @route   PUT /api/declarations/:id
// @access  Private
export const updateDeclaration = asyncHandler(async (req, res) => {
    const declaration = await Declaration.findById(req.params.id);

    if (!declaration) {
        res.status(404);
        throw new Error('Déclaration non trouvée');
    }

    // Vérifier si l'utilisateur est le propriétaire, un agent ou un admin
    if (declaration.user.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin' && 
        req.user.role !== 'commissariat_agent') {
        res.status(403);
        throw new Error('Non autorisé à modifier cette déclaration');
    }

    const updatedDeclaration = await Declaration.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    res.json(updatedDeclaration);
});

// @desc    Supprimer une déclaration
// @route   DELETE /api/declarations/:id
// @access  Private
export const deleteDeclaration = asyncHandler(async (req, res) => {
    const declaration = await Declaration.findById(req.params.id);

    if (!declaration) {
        res.status(404);
        throw new Error('Déclaration non trouvée');
    }

    // Vérifier si l'utilisateur est le propriétaire ou un admin
    if (declaration.user.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Non autorisé à supprimer cette déclaration');
    }

    await declaration.deleteOne();
    res.json({ message: 'Déclaration supprimée' });
});

// @desc    Obtenir les déclarations par commissariat
// @route   GET /api/declarations/commissariat/:commissariatId
// @access  Private/Commissariat_Agent/Admin
export const getDeclarationsByCommissariat = asyncHandler(async (req, res) => {
    try {
        let commissariatId;

        // Si l'utilisateur est un agent de commissariat, utiliser son commissariat
        if (req.user.role === 'commissariat_agent') {
            commissariatId = req.user.commissariat;
        } else if (req.user.role === 'admin') {
            // Si l'utilisateur est admin, utiliser l'ID fourni dans les paramètres
            commissariatId = req.params.commissariatId;
        } else {
            res.status(403);
            throw new Error('Non autorisé à accéder aux déclarations');
        }

        // Vérifier si le commissariat existe
        const commissariat = await Commissariat.findById(commissariatId);
        if (!commissariat) {
            res.status(404);
            throw new Error('Commissariat non trouvé');
        }

        // Récupérer les déclarations avec les informations associées
        const declarations = await Declaration.find({ commissariat: commissariatId })
            .populate('user', 'firstName lastName email')
            .populate('commissariat', 'name city')
            .sort({ createdAt: -1 }); // Trier par date de création décroissante

        res.json(declarations);
    } catch (error) {
        console.error('Erreur lors de la récupération des déclarations:', error);
        res.status(error.statusCode || 500);
        throw new Error(error.message || 'Erreur lors de la récupération des déclarations');
    }
});

// @desc    Mettre à jour le statut d'une déclaration
// @route   PUT /api/declarations/:id/status
// @access  Private/Commissariat_Agent/Admin
export const updateDeclarationStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const declaration = await Declaration.findById(req.params.id);

    if (!declaration) {
        res.status(404);
        throw new Error('Déclaration non trouvée');
    }

    declaration.status = status;
    declaration.processedAt = Date.now();
    await declaration.save();

    res.json(declaration);
});