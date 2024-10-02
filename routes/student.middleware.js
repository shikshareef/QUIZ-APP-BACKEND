const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET; // Ensure this is properly set in your environment variables

// Middleware to verify the student's JWT token
const verifyStudentToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token and extract student details
    const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET); // Split 'Bearer <token>'
    req.student = decoded; // Store the decoded token (studentId, regNo, etc.) in req
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = verifyStudentToken;
