const express = require('express');
const bcrypt = require('bcrypt');
const Faculty = require('../models/faculty.models')
const Organization = require('../models/organisation.models');
const verifyAdmin = require('./test.routes');

const router = express.Router();

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


module.exports = router;
