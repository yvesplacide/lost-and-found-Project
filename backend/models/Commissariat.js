// backend/models/Commissariat.js
import mongoose from 'mongoose';

const CommissariatSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a commissariat name'],
        unique: true,
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Please add an address'],
        trim: true
    },
    city: {
        type: String,
        required: [true, 'Please add a city'],
        trim: true
    },
    phone: {
        type: String,
        match: [
            /^((\+|00)[1-9]{1,4})?[ -]?([0-9]{2,4}[ -]?){3,5}[0-9]{2,4}$/,
            'Please add a valid phone number'
        ]
    },
    email: {
        type: String,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    // Si vous voulez assigner des agents à un commissariat directement
    // agents: [{
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'User'
    // }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Commissariat = mongoose.model('Commissariat', CommissariatSchema);

export default Commissariat;