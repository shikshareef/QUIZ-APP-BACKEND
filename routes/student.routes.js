const express = require('express');
const router = express.Router();
const Student = require('../models/students.models')
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const verifyAdmin = require('./test.routes');

// API to create a new student
router.post('/register-student', verifyAdmin ,  async (req, res) => {
    const { regNo, name, email, password } = req.body; // Get data from the request body

    // Validate the input
    if (!regNo || !name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if the student already exists
        const existingStudent = await Student.findOne({ email });
        if (existingStudent) {
            return res.status(400).json({ message: 'Student already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new student
        const newStudent = new Student({
            regNo,
            name,
            email,
            password: hashedPassword,
            // You can add the class field later when needed
        });

        // Save the student to the database
        await newStudent.save();

        return res.status(201).json({
            message: 'Student created successfully',
            student: newStudent,
        });
    } catch (error) {
        console.error('Error creating student:', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
});

router.get('/get-all', async (req, res) => {
    try {
        // Fetch all students from the database
        const students = await Student.find();

        // If no students found
        if (students.length === 0) {
            return res.status(404).json({ message: 'No students found' });
        }

        // Return the list of students
        return res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
});

module.exports = router;
