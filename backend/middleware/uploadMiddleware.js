import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Node.js built-in file system module

// --- Configuration du stockage Multer ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/'; // Dossier où les images seront sauvegardées
        
        // Crée le dossier 'uploads/' s'il n'existe pas
        // Assurez-vous que le chemin est relatif à la racine de votre application Node.js (là où vous exécutez 'node app.js' ou 'npm start')
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Nom du fichier : champ original + horodatage + extension originale
        // ex: photo_1678901234567.jpg
        cb(null, file.fieldname + '_' + Date.now() + path.extname(file.originalname));
    }
});

// --- Filtrage des types de fichiers (optionnel mais recommandé) ---
const fileFilter = (req, file, cb) => {
    // Vérifier si le fichier est une image
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // Accepte le fichier
    } else {
        // Rejette le fichier et envoie un message d'erreur
        cb(new Error('Seuls les fichiers image sont autorisés !'), false);
    }
};

// --- Initialisation de Multer ---
// On exporte 'upload' qui est l'objet Multer configuré.
// Vous pouvez ajouter des limites ici, par exemple 'limits: { fileSize: 1024 * 1024 * 5 }' pour 5 Mo
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // Limite la taille des fichiers à 5 Mo par fichier
    }
});

export default upload; // Exportation par défaut pour une importation facile