const express = require('express');
const router = express.Router();

// Middleware imports
const verifyStudentToken = require('./student.middleware');
const verifyFacultyToken = require('./facutly.middleware');
const verifyAdmin = require('./test.routes');

// Test routes
router.post('/test-student', verifyStudentToken, (req, res) => {
  res.status(200).send('Student token verified successfully!');
});

router.post('/test-faculty', verifyFacultyToken, (req, res) => {
  res.status(200).send('Faculty token verified successfully!');
});

router.post('/test-admin', verifyAdmin, (req, res) => {
  res.status(200).send('Admin token verified successfully!');
});

module.exports = router;
