// backend/routes/commissariatRoutes.js
import express from 'express';
import {
    getCommissariats,
    getCommissariatById,
    createCommissariat,
    updateCommissariat,
    deleteCommissariat
} from '../controllers/commissariatController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import ROLES from '../config/roles.js';

const router = express.Router();

// Routes pour les commissariats

// Obtenir tous les commissariats (accessible à tous, même non authentifiés pour choisir un commissariat)
// Cependant, si vous souhaitez que seul un utilisateur authentifié puisse les voir, ajoutez 'protect'
router.route('/')
    .get(getCommissariats) // Peut être public pour sélection par les utilisateurs
    .post(protect, authorize(ROLES.ADMIN), createCommissariat); // Création uniquement par admin

router.route('/:id')
    .get(getCommissariatById) // Peut être public pour détails
    .put(protect, authorize(ROLES.ADMIN), updateCommissariat) // Mise à jour uniquement par admin
    .delete(protect, authorize(ROLES.ADMIN), deleteCommissariat); // Suppression uniquement par admin

export default router;