const express = require('express');
const router = express.Router();
const Admin = require('../models/admins.models'); // Import the Admin model
const bcrypt = require('bcrypt');  // For password hashing
const Organization = require('../models/organisation.models');
const verifyAdmin = require('./test.routes')
const Class = require('../models/classes.models');
const Student = require('../models/students.models');

const SECRET_ADMIN = "VIT_SHAREEF_2025";

router.post('/create', async (req, res) => {
    try {
        const { name, email, password, secretKey } = req.body;

        // Check if the secret key is provided and correct
        if (secretKey !== SECRET_ADMIN) {
            return res.status(403).json({ message: 'Forbidden: Invalid secret key' });
        }

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({
            name,
            email,
            password: hashedPassword
        });

        // Save the admin in the database
        await newAdmin.save();

        // Return the created admin (you can customize the response)
        res.status(201).json({ message: 'Admin created successfully', adminId: newAdmin.adminId });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
});

router.post('/create-organization', verifyAdmin, async (req, res) => {
    const { name } = req.body; // Get organization name from the request body

    // Validate the input
    if (!name) {
        return res.status(400).json({ message: 'Organization name is required' });
    }

    try {
        // Create a new organization
        const newOrganization = new Organization({
            name,
            admin: req.adminMongoId, // Associate the admin with the organization
        });

        // Save the organization to the database
        await newOrganization.save();

        // Push the new organization ID into the admin's organizations array
        const admin = await Admin.findById(req.adminMongoId); // Fetch the admin using adminMongoId
        admin.organizations.push(newOrganization._id); // Assuming organizations is an array in your Admin schema
        await admin.save(); // Save the updated admin

        return res.status(201).json({
            message: 'Organization created successfully',
            organization: newOrganization,
        });
    } catch (error) {
        console.error('Error creating organization:', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
});

router.post('/create-class', verifyAdmin, async (req, res) => {
    const { name, organizationId } = req.body; // Get class name and organizationId from the request body

    // Validate the input
    if (!name || !organizationId) {
        return res.status(400).json({ message: 'Class name and organization ID are required' });
    }

    try {
        // Find the organization by organizationId (not by _id)
        const organization = await Organization.findOne({ organizationId }); // Change this line

        // Check if organization exists
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Create a new class
        const newClass = new Class({
            name,
            organization: organization._id, // Use ObjectId reference
        });

        // Save the class to the database
        await newClass.save();

        // Push the new class ID into the organization's classes array
        organization.classes.push(newClass._id);
        await organization.save(); // Save the updated organization

        return res.status(201).json({
            message: 'Class created successfully',
            class: newClass,
        });
    } catch (error) {
        console.error('Error creating class:', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
});


router.put('/add-student-to-class', verifyAdmin, async (req, res) => {
    const { regNo, classId } = req.body; // Extract regNo and classId from the request body

    // Validate input
    if (!regNo || !classId) {
        return res.status(400).json({ message: 'regNo and classId are required' });
    }

    try {
        // Find the student by regNo
        const student = await Student.findOne({ regNo });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Find the class by classId
        const classObj = await Class.findById(classId);
        if (!classObj) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Check if the student is already in the class
        if (!classObj.students.includes(student._id)) {
            classObj.students.push(student._id); // Add student ID to class's students array
        }

        // Add the class reference to the student's classes array if not already present
        if (!student.classes.includes(classObj._id)) {
            student.classes.push(classObj._id); // Add class ID to student's classes array
        }

        // Save both student and class
        await student.save();
        await classObj.save();

        return res.status(200).json({
            message: `Student with regNo ${regNo} added to class ${classObj.name} successfully.`,
            student,
            class: classObj,
        });
    } catch (error) {
        console.error('Error adding student to class:', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
});

router.get('/organizations', verifyAdmin, async (req, res) => {
    try {
        // Find the admin by the MongoDB ID stored in the request
        const admin = await Admin.findById(req.adminMongoId).populate('organizations');
        
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        return res.status(200).json({
            message: 'Organizations retrieved successfully',
            organizations: admin.organizations,
        });
    } catch (error) {
        console.error('Error retrieving organizations:', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
});


module.exports = router;
