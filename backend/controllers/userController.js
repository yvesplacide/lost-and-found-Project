// backend/controllers/userController.js
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import ROLES from '../config/roles.js';
import Commissariat from '../models/Commissariat.js'; // Pour vérifier l'existence du commissariat lors de l'assignation

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = asyncHandler(async (req, res) => {
    // Exclure les mots de passe et le champ __v
    const users = await User.find({}).select('-password -__v');
    res.status(200).json(users);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin)
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password -__v');

    if (user) {
        res.status(200).json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Create a new user (by Admin, including Commissariat Agents)
// @route   POST /api/users
// @access  Private (Admin)
const createUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, phone, address, profession, role, commissariatId } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Valider le rôle
    if (role && !Object.values(ROLES).includes(role)) {
        res.status(400);
        throw new Error('Rôle invalide');
    }

    // Vérifier le commissariat si c'est un agent
    let commissariat = null;
    if (role === ROLES.COMMISSARIAT_AGENT) {
        if (!commissariatId) {
            res.status(400);
            throw new Error('L\'ID du commissariat est requis pour un agent de commissariat');
        }
        commissariat = await Commissariat.findById(commissariatId);
        if (!commissariat) {
            res.status(404);
            throw new Error('Commissariat non trouvé');
        }
    }

    const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        phone,
        address,
        profession,
        role: role || ROLES.USER,
        commissariat: role === ROLES.COMMISSARIAT_AGENT ? commissariatId : undefined
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            address: user.address,
            profession: user.profession,
            role: user.role,
            commissariat: user.commissariat
        });
    } else {
        res.status(400);
        throw new Error('Données utilisateur invalides');
    }
});

// @desc    Update user profile / role (by Admin)
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, address, profession, role, commissariatId } = req.body;

    const user = await User.findById(req.params.id);

    if (user) {
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.phone = phone || user.phone;
        user.address = address || user.address;
        user.profession = profession || user.profession;

        // Vérifier l'email
        if (email && email !== user.email) {
            const userWithNewEmail = await User.findOne({ email });
            if (userWithNewEmail) {
                res.status(400);
                throw new Error('Cet email est déjà utilisé');
            }
            user.email = email;
        }

        // Mettre à jour le rôle
        if (role && Object.values(ROLES).includes(role)) {
            user.role = role;
        } else if (role && !Object.values(ROLES).includes(role)) {
            res.status(400);
            throw new Error('Rôle invalide');
        }

        // Gérer le commissariat pour les agents
        if (user.role === ROLES.COMMISSARIAT_AGENT) {
            if (commissariatId) {
                const commissariat = await Commissariat.findById(commissariatId);
                if (!commissariat) {
                    res.status(404);
                    throw new Error('Commissariat non trouvé');
                }
                user.commissariat = commissariatId;
            } else {
                res.status(400);
                throw new Error('L\'ID du commissariat est requis pour un agent de commissariat');
            }
        } else {
            user.commissariat = undefined;
        }

        const updatedUser = await user.save();

        res.status(200).json({
            _id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            phone: updatedUser.phone,
            address: updatedUser.address,
            profession: updatedUser.profession,
            role: updatedUser.role,
            commissariat: updatedUser.commissariat
        });
    } else {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        if (user.role === ROLES.ADMIN) {
            res.status(403);
            throw new Error('Cannot delete admin user');
        }
        await user.deleteOne();
        res.status(200).json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

export {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};