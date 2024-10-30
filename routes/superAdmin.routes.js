const express = require('express');
const router = express.Router();
const Admin = require('../models/admins.models'); 
const bcrypt = require('bcrypt'); 
const Organization = require('../models/organisation.models');
const verifyAdmin = require('./test.routes')
const Class = require('../models/classes.models');
const Student = require('../models/students.models');
const SuperAdmin = require('../models/superAdmin.models')
const jwt = require('jsonwebtoken');

const verifySuperAdminToken = require('./superAdmin.middleware');

router.get('/protected-route', verifySuperAdminToken, (req, res) => {
    // Now you have access to req.superAdmin
    console.log(req.superAdmin)
    res.send('This is a protected route');
});


router.post('/register-superadmin', async (req, res) => {
    const { superAdminId, name, email, password, superAdminKey } = req.body;

    // Validation logic here
    if (!superAdminId || !name || !email || !password || !superAdminKey) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newSuperAdmin = new SuperAdmin({
        superAdminId, // Using the provided superAdminId
        name,
        email,
        password: hashedPassword, // Save the hashed password
        superAdminKey,
    });

    try {
        await newSuperAdmin.save();
        res.status(201).json({ message: 'Super Admin registered successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Error registering Super Admin' });
    }
});

router.post('/superadmin/login', async (req, res) => {
    const { superAdminId, superAdminKey } = req.body; // Get superAdminId and superAdminKey from the request body

    // Validate input
    if (!superAdminId || !superAdminKey) {
        return res.status(400).json({ message: 'superAdminId and superAdminKey are required' });
    }

    try {
        // Find the super admin by superAdminId
        const superAdmin = await SuperAdmin.findOne({ superAdminId });
        if (!superAdmin) {
            return res.status(404).json({ message: 'Super Admin not found' });
        }

        // Validate the superAdminKey
        if (superAdminKey !== superAdmin.superAdminKey) {
            return res.status(401).json({ message: 'Invalid superAdminKey' });
        }

        // Generate a token using superAdminId, superAdmin's MongoDB ID, and superAdminKey
        const token = jwt.sign(
            { superAdminId: superAdmin.superAdminId, id: superAdmin._id, superAdminKey },
            process.env.JWT_SECRET, // Your secret key for signing the JWT
            { expiresIn: '10h' } // Token expiration time
        );

        return res.status(200).json({
            message: 'Login successful',
            token,
            superAdmin: {
                superAdminId: superAdmin.superAdminId,
                name: superAdmin.name, // Assuming you have a name field in the SuperAdmin model
            }
        });
    } catch (error) {
        console.error('Error during super admin login:', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
});

const SECRET_ADMIN = process.env.SECRET_ADMIN;

router.post('/map-org-adm', verifySuperAdminToken, async (req, res) => {
    try {
        const { organizationName, adminName, adminEmail, adminPassword, secretKey } = req.body;
        const superAdminId = req.superAdmin.id; // Extracted from verifySuperAdminToken middleware
        // Secret Key Validation
        if (secretKey !== SECRET_ADMIN) {
            return res.status(403).json({ message: 'Forbidden: Invalid secret key' });
        }

        // Check if the admin already exists
        const existingAdmin = await Admin.findOne({ email: adminEmail });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin with this email already exists' });
        }

        // Hash password and create new Admin
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const newAdmin = new Admin({
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
        });
        await newAdmin.save();

        // Create new Organization linked to this Admin
        const newOrganization = new Organization({
            name: organizationName,
            admin: newAdmin._id,
        });
        await newOrganization.save();

        // Link the organization to the admin
        newAdmin.organizations.push(newOrganization._id);
        await newAdmin.save();

        // Map the organization and admin to the superAdmin
        await SuperAdmin.findByIdAndUpdate(superAdminId, {
            $push: {
                organizations: newOrganization._id,
                admins: newAdmin._id,
            },
        });

        res.status(201).json({
            message: 'Organization and Admin created successfully and mapped to SuperAdmin',
            organization: {
                id: newOrganization._id,
                name: newOrganization.name,
            },
            admin: {
                id: newAdmin._id,
                name: newAdmin.name,
                email: newAdmin.email,
            },
        });
    } catch (error) {
        console.error('Error creating organization, admin, and mapping:', error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
});


module.exports = router;