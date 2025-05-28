// backend/server.js
import express from 'express'; // <-- MODIFIÉ
import dotenv from 'dotenv'; // <-- MODIFIÉ
import cors from 'cors'; // <-- MODIFIÉ
import fileUpload from 'express-fileupload'; // <-- MODIFIÉ
import connectDB from './config/db.js'; // <-- MODIFIÉ, notez le .js

// Charger les variables d'environnement
dotenv.config();

// Connecter à la base de données
connectDB();

const app = express();

// Middlewares
app.use(express.json()); // Permet de parser les requêtes JSON
app.use(cors()); // Active CORS pour toutes les requêtes
app.use(fileUpload()); // Pour gérer l'upload de fichiers

// Route de test (optionnel)
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Importation des routes (à décommenter et utiliser plus tard)
// import authRoutes from './routes/authRoutes.js';
// app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port http://localhost:${PORT}`);
});