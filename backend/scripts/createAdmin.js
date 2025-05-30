import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import ROLES from '../config/roles.js';

dotenv.config();

const createAdmin = async () => {
    try {
        // Connexion à la base de données
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connecté à MongoDB');

        // Créer l'administrateur
        const admin = await User.create({
            firstName: 'Admin',
            lastName: 'System',
            email: 'admin@system.com',
            password: 'admin123',
            role: ROLES.ADMIN
        });

        console.log('Administrateur créé avec succès:', admin);
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de la création de l\'administrateur:', error);
        process.exit(1);
    }
};

createAdmin(); 