// backend/controllers/authController.js
import asyncHandler from 'express-async-handler';
import User from '../models/User.js'; // Importe le modèle User
import ROLES from '../config/roles.js'; // Importe les rôles

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { 
        firstName, 
        lastName, 
        email, 
        password, 
        phone, 
        address, 
        profession,
        dateOfBirth,
        birthPlace 
    } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400); // Bad Request
        throw new Error('User already exists');
    }

    // Créer un nouvel utilisateur avec le rôle par défaut (user)
    const user = await User.create({
        firstName,
        lastName,
        email,
        password, // Le mot de passe sera haché par le middleware pre('save') du modèle User
        phone,
        address,
        profession,
        dateOfBirth,
        birthPlace,
        role: ROLES.USER // S'assurer que le rôle est 'user' pour les inscriptions publiques
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
            dateOfBirth: user.dateOfBirth,
            birthPlace: user.birthPlace,
            role: user.role,
            token: user.getSignedJwtToken(), // Générer et envoyer le token JWT
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe et obtenir le mot de passe (select: false)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        res.status(401); // Unauthorized
        throw new Error('Invalid credentials');
    }

    // Vérifier si le mot de passe correspond
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        res.status(401); // Unauthorized
        throw new Error('Invalid credentials');
    }

    // Si tout est bon, renvoyer les infos utilisateur et le token
    res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profession: user.profession,
        role: user.role,
        token: user.getSignedJwtToken(), // Générer et envoyer le token JWT
    });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    // req.user est défini par le middleware protect
    const user = await User.findById(req.user._id)
        .select('-password')
        .populate('commissariat', 'name city');

    if (user) {
        res.json({
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
        res.status(404);
        throw new Error('User not found');
    }
});


export { registerUser, loginUser, getMe };