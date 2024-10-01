const Admin = require('../models/admins.models');

// Middleware to verify if the user is an admin and retrieve the admin object
const verifyAdmin = async (req, res, next) => {
    console.log(req.body); // Log the request body for debugging
    const { adminId } = req.body; // Get adminId from the request body

    if (!adminId) {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    try {
        // Fetch the admin from the database using the adminId
        const admin = await Admin.findOne({ adminId: adminId });

        // Check if admin exists
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Attach the full admin object to the request for further use
        req.admin = admin;
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Error verifying admin:', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
};

module.exports = { verifyAdmin };
