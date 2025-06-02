// backend/routes/declarationRoutes.js
import express from 'express';
import {
    createDeclaration,
    getDeclarations,
    getMyDeclarations,
    getDeclarationById,
    updateDeclaration,
    deleteDeclaration,
    getDeclarationsByCommissariat,
    updateDeclarationStatus
} from '../controllers/declarationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Créer une déclaration (protégé pour les utilisateurs connectés, role: 'user')
router.post('/', protect, authorize('user'), upload.array('photos', 5), createDeclaration);

// Obtenir toutes les déclarations (accessible uniquement par l'admin)
router.get('/', protect, authorize('admin'), getDeclarations);

// Obtenir les déclarations de l'utilisateur connecté
router.get('/my-declarations', protect, authorize('user'), getMyDeclarations);

// Obtenir les déclarations par commissariat
router.get('/commissariat/:commissariatId', protect, authorize('commissariat_agent', 'admin'), getDeclarationsByCommissariat);

// Routes pour une déclaration spécifique
router.route('/:id')
    .get(protect, getDeclarationById)
    .put(protect, authorize('admin', 'commissariat_agent', 'user'), upload.array('photos', 5), updateDeclaration)
    .delete(protect, authorize('admin', 'user'), deleteDeclaration);

// Mettre à jour le statut d'une déclaration
router.put('/:id/status', protect, authorize('commissariat_agent', 'admin'), updateDeclarationStatus);

// Mettre à jour le récépissé d'une déclaration
router.put('/:id/receipt', protect, authorize('commissariat_agent', 'admin'), updateDeclaration);

export default router;