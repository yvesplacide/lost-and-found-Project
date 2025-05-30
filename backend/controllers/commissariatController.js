// backend/controllers/commissariatController.js
import asyncHandler from 'express-async-handler';
import Commissariat from '../models/Commissariat.js';
import User from '../models/User.js';
import ROLES from '../config/roles.js';


// @desc    Get all commissariats
// @route   GET /api/commissariats
// @access  Public (pour les utilisateurs pour choisir un commissariat)
//          Private (pour les agents et admins pour gestion)
const getCommissariats = asyncHandler(async (req, res) => {
    const commissariats = await Commissariat.find({}).select('-__v');
    res.status(200).json(commissariats);
});

// @desc    Get single commissariat by ID
// @route   GET /api/commissariats/:id
// @access  Public (pour les utilisateurs pour voir les détails)
//          Private (pour les agents et admins pour gestion)
const getCommissariatById = asyncHandler(async (req, res) => {
    const commissariat = await Commissariat.findById(req.params.id).select('-__v');

    if (commissariat) {
        res.status(200).json(commissariat);
    } else {
        res.status(404);
        throw new Error('Commissariat not found');
    }
});

// @desc    Create a new commissariat
// @route   POST /api/commissariats
// @access  Private (Admin Only)
const createCommissariat = asyncHandler(async (req, res) => {
    const { name, address, city, phone, email } = req.body;

    // Vérifier si un commissariat avec ce nom existe déjà
    const commissariatExists = await Commissariat.findOne({ name });
    if (commissariatExists) {
        res.status(400);
        throw new Error('Commissariat with this name already exists');
    }

    const commissariat = await Commissariat.create({
        name,
        address,
        city,
        phone,
        email
    });

    if (commissariat) {
        res.status(201).json(commissariat);
    } else {
        res.status(400);
        throw new Error('Invalid commissariat data');
    }
});

// @desc    Update commissariat
// @route   PUT /api/commissariats/:id
// @access  Private (Admin Only)
const updateCommissariat = asyncHandler(async (req, res) => {
    const { name, address, city, phone, email } = req.body;

    const commissariat = await Commissariat.findById(req.params.id);

    if (commissariat) {
        commissariat.name = name || commissariat.name;
        commissariat.address = address || commissariat.address;
        commissariat.city = city || commissariat.city;
        commissariat.phone = phone || commissariat.phone;
        commissariat.email = email || commissariat.email;

        const updatedCommissariat = await commissariat.save();
        res.status(200).json(updatedCommissariat);
    } else {
        res.status(404);
        throw new Error('Commissariat not found');
    }
});

// @desc    Delete commissariat
// @route   DELETE /api/commissariats/:id
// @access  Private (Admin Only)
const deleteCommissariat = asyncHandler(async (req, res) => {
    const commissariat = await Commissariat.findById(req.params.id);

    if (commissariat) {
        try {
            // Vérifier s'il y a des agents assignés à ce commissariat
            const agentsCount = await User.countDocuments({ 
                commissariat: req.params.id,
                role: ROLES.COMMISSARIAT_AGENT 
            });

            if (agentsCount > 0) {
                res.status(400);
                throw new Error('Impossible de supprimer ce commissariat car il a des agents assignés. Veuillez d\'abord réassigner ou supprimer les agents.');
            }

            // Supprimer le commissariat
            await commissariat.deleteOne();
            res.status(200).json({ message: 'Commissariat supprimé avec succès' });
        } catch (error) {
            console.error('Erreur lors de la suppression du commissariat:', error);
            res.status(500);
            throw new Error('Erreur lors de la suppression du commissariat: ' + error.message);
        }
    } else {
        res.status(404);
        throw new Error('Commissariat non trouvé');
    }
});

export {
    getCommissariats,
    getCommissariatById,
    createCommissariat,
    updateCommissariat,
    deleteCommissariat
};