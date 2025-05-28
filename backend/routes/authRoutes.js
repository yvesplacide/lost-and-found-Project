// backend/routes/authRoutes.js
import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js'; // Importe les fonctions du contrôleur
import { protect } from '../middleware/authMiddleware.js'; // Importe le middleware de protection

const router = express.Router();

router.post('/register', registerUser); // Route d'inscription
router.post('/login', loginUser);       // Route de connexion
router.get('/me', protect, getMe);      // Route pour obtenir l'utilisateur connecté (protégée)

export default router;