const Admin = require('../models/admins.models'); // Import the Admin model
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken'); // JWT for token verification

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']; // Assuming token is sent in the Authorization header

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    // Remove "Bearer " from the token if it's present
    const bearerToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }

        // Attach decoded admin information to request object
        req.adminId = decoded.adminId; // The adminId from the token
        req.adminMongoId = decoded.id; // The MongoDB ID from the token
        next(); // Proceed to the next middleware or route handler
    });
};

module.exports = verifyToken;
