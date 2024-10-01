const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET; // Same secret key used in login route


const verifyFacultyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'Access denied. No token provided.' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET); // Split 'Bearer <token>'
        req.faculty = decoded; // Store the decoded token (facultyId, regId, etc.) in req
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = verifyFacultyToken;
