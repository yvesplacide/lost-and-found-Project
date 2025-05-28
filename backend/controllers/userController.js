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
    const { firstName, lastName, email, password, phone, address, role, commissariatId } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User with this email already exists');
    }

    // Valider le rôle
    if (role && !Object.values(ROLES).includes(role)) {
        res.status(400);
        throw new Error('Invalid role specified');
    }

    let assignedCommissariat = null;
    if (role === ROLES.COMMISSARIAT_AGENT) {
        if (!commissariatId) {
            res.status(400);
            throw new Error('Commissariat ID is required for a commissariat agent');
        }
        assignedCommissariat = await Commissariat.findById(commissariatId);
        if (!assignedCommissariat) {
            res.status(404);
            throw new Error('Assigned Commissariat not found');
        }
    } else if (commissariatId && role !== ROLES.COMMISSARIAT_AGENT) {
         res.status(400);
         throw new Error('Commissariat ID should only be provided for commissariat agents');
    }


    const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        phone,
        address,
        role: role || ROLES.USER, // Si pas de rôle spécifié, par défaut 'user'
        commissariat: assignedCommissariat ? assignedCommissariat._id : undefined // Assigner le commissariat pour les agents
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: user.role,
            commissariat: user.commissariat, // Inclure le commissariat si pertinent
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Update user profile / role (by Admin)
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, address, role, commissariatId } = req.body;

    const user = await User.findById(req.params.id);

    if (user) {
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.phone = phone || user.phone;
        user.address = address || user.address;

        // L'email peut être mis à jour, mais vérifier l'unicité
        if (email && email !== user.email) {
            const userWithNewEmail = await User.findOne({ email });
            if (userWithNewEmail) {
                res.status(400);
                throw new Error('Email is already taken');
            }
            user.email = email;
        }

        // Mettre à jour le rôle
        if (role && Object.values(ROLES).includes(role)) {
            user.role = role;
        } else if (role && !Object.values(ROLES).includes(role)) {
            res.status(400);
            throw new Error('Invalid role specified');
        }

        // Mettre à jour le commissariat pour les agents
        if (user.role === ROLES.COMMISSARIAT_AGENT) {
            if (commissariatId) {
                const assignedCommissariat = await Commissariat.findById(commissariatId);
                if (!assignedCommissariat) {
                    res.status(404);
                    throw new Error('Assigned Commissariat not found');
                }
                user.commissariat = assignedCommissariat._id;
            } else {
                // Si le rôle est agent et qu'il n'y a pas de commissariatId, le supprimer
                user.commissariat = undefined;
            }
        } else {
             // Si le rôle n'est pas agent, s'assurer que le champ commissariat est vide
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
            role: updatedUser.role,
            commissariat: updatedUser.commissariat,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
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