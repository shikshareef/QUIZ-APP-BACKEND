const mongoose = require('mongoose');

const superAdminSchema = new mongoose.Schema({
    superAdminId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    superAdminKey: {  // Added secret key field
        type: String,
        required: true,
        unique: true,
    },
    organizations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization', // Reference to the Organization model
    }],
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin', // Reference to the Admin model
    }],
}, {
    timestamps: true,
});

const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);
module.exports = SuperAdmin;
