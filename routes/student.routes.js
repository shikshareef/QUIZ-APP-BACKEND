const express = require('express');
const router = express.Router();
const Student = require('../models/students.models')
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const verifyAdmin = require('./test.routes');
const Organization =  require('../models/organisation.models')

// API to create a new student
router.post('/register-student', verifyAdmin, async (req, res) => {
    const { regNo, name, email, password, organizationId } = req.body; // Get organizationId from the request body

    // Validate the input
    if (!regNo || !name || !email || !password || !organizationId) {
        return res.status(400).json({ message: 'All fields, including organizationId, are required' });
    }

    try {
        // Check if the organization exists
        const organization = await Organization.findById(organizationId);
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Check if the student already exists
        const existingStudent = await Student.findOne({ email });
        if (existingStudent) {
            return res.status(400).json({ message: 'Student already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new student and link to the organization
        const newStudent = new Student({
            regNo,
            name,
            email,
            password: hashedPassword,
            organization: organization._id // Link to the organization
        });

        // Save the student to the database
        await newStudent.save();

        // Add the new student's ID to the organization's students array
        organization.students.push(newStudent._id);
        await organization.save(); // Save the updated organization

        return res.status(201).json({
            message: 'Student created successfully and added to the organization',
            student: newStudent,
        });
    } catch (error) {
        console.error('Error creating student:', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
});


router.get('/organization/get-all', verifyAdmin ,  async (req, res) => {
    const { organizationId } = req.body; // Get organizationId from the request body

    // Validate input
    if (!organizationId) {
        return res.status(400).json({ message: 'Organization ID is required' });
    }

    try {
        // Find the organization by its ID and populate the students field
        const organization = await Organization.findById(organizationId).populate('students');

        // If organization is not found
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // If no students are associated with the organization
        if (organization.students.length === 0) {
            return res.status(404).json({ message: 'No students found for this organization' });
        }

        // Return the list of students
        return res.status(200).json({
            message: 'Students retrieved successfully',
            students: organization.students
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
});


module.exports = router;
