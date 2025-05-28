// backend/routes/userRoutes.js
import express from 'express';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import ROLES from '../config/roles.js';

const router = express.Router();

// Toutes les routes de gestion des utilisateurs nécessitent d'être admin
router.route('/')
    .get(protect, authorize(ROLES.ADMIN), getUsers) // Obtenir tous les utilisateurs
    .post(protect, authorize(ROLES.ADMIN), createUser); // Créer un nouvel utilisateur (y compris agents et admins)

router.route('/:id')
    .get(protect, authorize(ROLES.ADMIN), getUserById) // Obtenir un utilisateur par ID
    .put(protect, authorize(ROLES.ADMIN), updateUser)  // Mettre à jour un utilisateur
    .delete(protect, authorize(ROLES.ADMIN), deleteUser); // Supprimer un utilisateur

export default router;