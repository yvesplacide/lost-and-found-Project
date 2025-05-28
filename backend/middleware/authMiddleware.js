// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Importe le modèle User
import asyncHandler from 'express-async-handler'; // Un package utilitaire pour gérer les erreurs asynchrones (installons-le !)

// Middleware pour protéger les routes (vérifier le token JWT)
const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Obtenir le token depuis l'en-tête
            token = req.headers.authorization.split(' ')[1];

            // Vérifier le token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attacher l'utilisateur au req.user (sans le mot de passe)
            req.user = await User.findById(decoded.id).select('-password');
            req.userRole = decoded.role; // Stocker le rôle de l'utilisateur

            next();
        } catch (error) {
            console.error('Not authorized, token failed', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
});

// Middleware pour restreindre l'accès en fonction des rôles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user ? req.user.role : 'unauthorized'} is not authorized to access this route`
            });
        }
        next();
    };
};

export { protect, authorize };