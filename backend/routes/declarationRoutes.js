// backend/routes/declarationRoutes.js
import express from 'express';
import {
    createDeclaration,
    getMyDeclarations,
    getAllDeclarations,
    getDeclarationById,
    updateDeclarationStatus,
    deleteDeclaration
} from '../controllers/declarationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import ROLES from '../config/roles.js';

const router = express.Router();

// Routes accessibles par différents rôles

// Créer une déclaration (uniquement les utilisateurs standard)
router.post('/', protect, authorize(ROLES.USER), createDeclaration);

// Obtenir ses propres déclarations (uniquement les utilisateurs standard)
router.get('/my-declarations', protect, authorize(ROLES.USER), getMyDeclarations);

// Obtenir toutes les déclarations (agents de commissariat et administrateurs)
router.get('/', protect, authorize(ROLES.COMMISSARIAT_AGENT, ROLES.ADMIN), getAllDeclarations);

// Obtenir une déclaration spécifique par ID (tous les rôles autorisés)
router.get('/:id', protect, authorize(ROLES.USER, ROLES.COMMISSARIAT_AGENT, ROLES.ADMIN), getDeclarationById);

// Mettre à jour le statut d'une déclaration et assigner un agent (agents de commissariat et administrateurs)
router.put('/:id/status', protect, authorize(ROLES.COMMISSARIAT_AGENT, ROLES.ADMIN), updateDeclarationStatus);

// Supprimer une déclaration (administrateurs ou l'utilisateur lui-même si "En attente")
router.delete('/:id', protect, authorize(ROLES.USER, ROLES.ADMIN), deleteDeclaration);

export default router;