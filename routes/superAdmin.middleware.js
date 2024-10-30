const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET; // Same secret key used in login route

const verifySuperAdminToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'Access denied. No token provided.' });
    }

    try {
        // Extract token from 'Bearer <token>' format
        const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
        
        // Attach decoded token data to request object for use in routes
        req.superAdmin = {
            superAdminId: decoded.superAdminId,
            id: decoded.id,
            superAdminKey: decoded.superAdminKey
        };

        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = verifySuperAdminToken;
