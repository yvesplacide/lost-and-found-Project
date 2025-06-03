// backend/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ROLES from '../config/roles.js'; // Importation des rôles

const UserSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'Please add a first name'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Please add a last name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false // Ne pas retourner le mot de passe par défaut dans les requêtes
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number'],
        match: [
            /^((\+|00)[1-9]{1,4})?[ -]?([0-9]{2,4}[ -]?){3,5}[0-9]{2,4}$/,
            'Please add a valid phone number'
        ]
    },
    profession: {
        type: String,
        required: [true, 'Please add a profession'],
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Please add an address'],
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Please add a date of birth']
    },
    birthPlace: {
        type: String,
        required: [true, 'Please add a place of birth'],
        trim: true
    },
    role: {
        type: String,
        enum: Object.values(ROLES), // Utilise les valeurs définies dans config/roles.js
        default: ROLES.USER // Le rôle par défaut est 'user'
    },
    commissariat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Commissariat',
        required: function() {
            return this.role === ROLES.COMMISSARIAT_AGENT;
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware Mongoose pour hacher le mot de passe avant de sauvegarder
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) { // Seulement hacher si le mot de passe est modifié
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Méthode Mongoose pour comparer les mots de passe
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Méthode Mongoose pour générer un token JWT
UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

const User = mongoose.model('User', UserSchema);

export default User;