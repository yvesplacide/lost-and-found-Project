// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import declarationRoutes from './routes/declarationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import commissariatRoutes from './routes/commissariatRoutes.js';

// Charger les variables d'environnement
dotenv.config();

// Connecter à la base de données
connectDB();

const app = express();

// Middlewares
app.use(express.json()); // Permet de parser les requêtes JSON
app.use(cors()); // Active CORS pour toutes les requêtes

// Route de test (optionnel)
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Servir les fichiers statiques du dossier uploads
app.use('/uploads', express.static('uploads'));

// Importation des routes
app.use('/api/auth', authRoutes);
app.use('/api/declarations', declarationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/commissariats', commissariatRoutes);

// Middlewares d'erreur (doivent être après toutes les routes)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port http://localhost:${PORT}`);
});