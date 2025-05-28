// backend/controllers/commissariatController.js
import asyncHandler from 'express-async-handler';
import Commissariat from '../models/Commissariat.js';

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
        // Optionnel: Vérifier si des déclarations sont liées à ce commissariat avant de le supprimer
        // const declarationsCount = await Declaration.countDocuments({ commissariat: req.params.id });
        // if (declarationsCount > 0) {
        //     res.status(400);
        //     throw new Error('Cannot delete commissariat with existing declarations. Please reassign declarations first.');
        // }
        // Optionnel: Désassigner les agents liés à ce commissariat
        await User.updateMany({ commissariat: req.params.id }, { $unset: { commissariat: 1 } });


        await commissariat.deleteOne();
        res.status(200).json({ message: 'Commissariat removed' });
    } else {
        res.status(404);
        throw new Error('Commissariat not found');
    }
});

export {
    getCommissariats,
    getCommissariatById,
    createCommissariat,
    updateCommissariat,
    deleteCommissariat
};