const express = require('express');
const router = express.Router();
const Admin = require('../models/admins.models'); // Import the Admin model
const jwt = require('jsonwebtoken'); // JWT for token generation
 

router.post('/admin/login', async (req, res) => {
    const { adminId, secret } = req.body; // Get adminId and secret from the request body

    // Validate input
    if (!adminId || !secret) {
        return res.status(400).json({ message: 'adminId and secret are required' });
    }

    try {
        // Find the admin by adminId
        const admin = await Admin.findOne({ adminId });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Compare provided secret with SECRET_ADMIN from the .env file
        if (secret !== process.env.SECRET_ADMIN) {
            return res.status(401).json({ message: 'Invalid secret' });
        }

        // Generate a token using adminId, admin's MongoDB ID, and SECRET_ADMIN
        const token = jwt.sign(
            { adminId: admin.adminId, id: admin._id, secret: process.env.SECRET_ADMIN },
            process.env.JWT_SECRET, // Your secret key for signing the JWT
            { expiresIn: '5h' } // Token expiration time
        );

        return res.status(200).json({
            message: 'Login successful',
            token,
            admin: {
                adminId: admin.adminId,
                name: admin.name, // Assuming you have a name field in the Admin model
            }
        });
    } catch (error) {
        console.error('Error during admin login:', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
});

module.exports = router;
