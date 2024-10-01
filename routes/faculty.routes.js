const express = require('express');
const bcrypt = require('bcrypt');
const Faculty = require('../models/faculty.models')
const Organization = require('../models/organisation.models');
const verifyAdmin = require('./test.routes');
const jwt = require('jsonwebtoken')
const router = express.Router();
const verifyFacultyToken = require('./facutly.middleware')

router.post('/register-faculty', verifyAdmin, async (req, res) => {
    const { regId, name, email, password, organizationId } = req.body;

    // Validate the input
    if (!regId || !name || !email || !password || !organizationId) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if the faculty already exists
        const existingFaculty = await Faculty.findOne({ email });
        if (existingFaculty) {
            return res.status(400).json({ message: 'Faculty already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Find the organization by organizationId
        const organization = await Organization.findById(organizationId);
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Create a new faculty member
        const newFaculty = new Faculty({
            regId,
            name,
            email,
            password: hashedPassword,
            organization: organization._id,
        });

        // Save the new faculty member
        await newFaculty.save();

        // Add faculty reference to the organization
if (!organization.faculties.includes(newFaculty._id)) {
    organization.faculties.push(newFaculty._id);
    await organization.save();
}


        return res.status(201).json({
            message: 'Faculty registered successfully',
            faculty: newFaculty,
        });
    } catch (error) {
        console.error('Error registering faculty:', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
});

router.post('/faculty-login', async (req, res) => {
    const { regId, password } = req.body;

    // Validate input
    if (!regId || !password) {
        return res.status(400).json({ message: 'regId and password are required' });
    }

    try {
        // Find the faculty by regId
        const faculty = await Faculty.findOne({ regId });
        if (!faculty) {
            return res.status(404).json({ message: 'Faculty not found' });
        }

        // Check if the password matches
        const isPasswordValid = await bcrypt.compare(password, faculty.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Generate JWT token
        const token = jwt.sign({ facultyId: faculty._id, regId: faculty.regId }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(200).json({
            message: 'Login successful',
            token, // Return the token
            faculty: {
                facultyId: faculty._id,
                name: faculty.name,
                email: faculty.email,
                regId: faculty.regId,
                organization: faculty.organization,
                role: faculty.role
            }
        });
    } catch (error) {
        console.error('Error logging in faculty:', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
});

router.get('/get-classes', verifyFacultyToken, async (req, res) => {
    try {
        // The faculty ID is stored in the req.faculty object by the middleware
        const facultyId = req.faculty.facultyId; // Assuming facultyId is stored in the token payload

        // Find the faculty and populate the organization and its classes
        const faculty = await Faculty.findById(facultyId).populate({
            path: 'organization',
            populate: {
                path: 'classes', // Populate the classes associated with the organization
            },
        });

        if (!faculty) {
            return res.status(404).json({ message: 'Faculty not found' });
        }

        const organizationClasses = faculty.organization?.classes || []; // Get classes, default to an empty array

        if (organizationClasses.length === 0) {
            return res.status(404).json({ message: 'No classes found for this faculty\'s organization' });
        }

        return res.status(200).json({
            message: 'Classes fetched successfully',
            classes: organizationClasses,
        });
    } catch (error) {
        console.error('Error fetching classes:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;
