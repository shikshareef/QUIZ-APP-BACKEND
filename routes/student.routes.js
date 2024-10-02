const express = require('express');
const router = express.Router();
const Student = require('../models/students.models')
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const verifyAdmin = require('./test.routes');
const Organization =  require('../models/organisation.models')
const Class = require('../models/classes.models')
const jwt = require('jsonwebtoken')
const verifyStudentToken = require('./student.middleware')

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


router.post('/organization/get-all', verifyAdmin ,  async (req, res) => {
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

router.put('/add-student-to-class', verifyAdmin, async (req, res) => {
    const { studentId, classId } = req.body; // Extract studentId and classId from the request body

    // Validate input
    if (!studentId || !classId) {
        return res.status(400).json({ message: 'studentId and classId are required' });
    }

    try {
        // Find the student by studentId
        const student = await Student.findById(studentId);
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
            message: `Student with ID ${studentId} added to class ${classObj.name} successfully.`,
            student,
            class: classObj,
        });
    } catch (error) {
        console.error('Error adding student to class:', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
});

router.post('/class-students', verifyAdmin, async (req, res) => {
    const { classId } = req.body; // Get the classId from the request body

    // Validate input
    if (!classId) {
        return res.status(400).json({ message: 'classId is required' });
    }

    try {
        // Find the class by its MongoDB ObjectId
        const classObj = await Class.findById(classId).populate('students'); // Populate students array with student details

        // Check if class exists
        if (!classObj) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Return the list of students in the class
        return res.status(200).json({
            message: `Students in class ${classObj.name} retrieved successfully`,
            students: classObj.students, // Returning populated students
        });
    } catch (error) {
        console.error('Error retrieving students for class:', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
});

router.put('/remove-student-from-class', verifyAdmin, async (req, res) => {
    const { classId, studentId } = req.body; // Get the classId and studentId from the request body

    // Validate input
    if (!classId || !studentId) {
        return res.status(400).json({ message: 'classId and studentId are required' });
    }

    try {
        // Find the class by its MongoDB ObjectId
        const classObj = await Class.findById(classId);
        if (!classObj) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Find the student by its MongoDB ObjectId
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Remove the student from the class's students array
        classObj.students.pull(studentId); // Using pull to remove studentId

        // Remove the class from the student's classes array
        student.classes.pull(classId); // Using pull to remove classId

        // Save both student and class after modification
        await Promise.all([classObj.save(), student.save()]);

        return res.status(200).json({
            message: `Student with ID ${studentId} successfully removed from class ${classObj.name}.`,
            student,
            class: classObj,
        });
    } catch (error) {
        console.error('Error removing student from class:', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
});

//auth routes for students 
router.post('/login', async (req, res) => {
    const { regNo, password } = req.body;
  
    // Validate input
    if (!regNo || !password) {
      return res.status(400).json({ message: 'Please provide both regNo and password.' });
    }
  
    try {
      // Find the student by regNo
      const student = await Student.findOne({ regNo });
  
      if (!student) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
  
      // Compare the provided password with the hashed password
      const isMatch = await bcrypt.compare(password, student.password);
  
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
  
      // Generate JWT token
      const token = jwt.sign(
        { studentId: student._id, regNo: student.regNo },
        process.env.JWT_SECRET,
        { expiresIn: '10h' } // Token expires in 1 hour
      );
  
      // Send the token and student info back to the client
      return res.status(200).json({
        message: 'Login successful!',
        token,
        student: {
          studentId: student.studentId,
          regNo: student.regNo,
          name: student.name,
          email: student.email,
        },
      });
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ message: 'An error occurred during login.' });
    }
  });

  router.get('/my-organizations', verifyStudentToken, async (req, res) => {
    try {
      const studentId = req.student.studentId; // Get studentId from the verified token and its mongodb token 
  
      // Find the student with the given studentId and populate organization
      const student = await Student.findById(studentId).populate('organization');
  
      if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
      }
  
      // Check if the organization is populated
      const organization = student.organization; // Organization is already populated
  
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found.' });
      }
  
      // Return the organization details
      return res.status(200).json({
        message: 'Organization details fetched successfully!',
        organization,
      });
    } catch (error) {
      console.error('Error fetching organization details:', error);
      return res.status(500).json({ message: 'An error occurred while fetching organization details.' });
    }
  });

  router.get('/my-classes', verifyStudentToken, async (req, res) => {
    try {
      const studentId = req.student.studentId; // Get studentId from the verified token
  
      // Find the student by studentId and populate the classes field
      const student = await Student.findById(studentId).populate('classes');
  
      if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
      }
  
      // Check if the student has any classes
      if (!student.classes || student.classes.length === 0) {
        return res.status(444).json({ message: 'No classes found for this student.' });
      }
  
      // Return the classes details
      return res.status(200).json({
        message: 'Classes fetched successfully!',
        classes: student.classes,
      });
    } catch (error) {
      console.error('Error fetching classes:', error);
      return res.status(500).json({ message: 'An error occurred while fetching classes.' });
    }
  });

  router.get('/quizzes', verifyStudentToken, async (req, res) => {
    const { classId } = req.body; // Get the classId from the request body
  
    // Validate input
    if (!classId) {
      return res.status(400).json({ message: 'Please provide the classId in the request body.' });
    }
  
    try {
      // Find the class by classId and populate the quizzes
      const classData = await Class.findById(classId).populate({
        path: 'quizzes',
        select: '_id quizId title startTime endTime scheduledDate active', // Select required fields including _id
      });
  
      if (!classData) {
        return res.status(404).json({ message: 'Class not found.' });
      }
  
      // Check if the class has quizzes
      const quizzes = classData.quizzes; // Quizzes are already populated
  
      // Return the quizzes details
      return res.status(200).json({
        message: 'Quizzes fetched successfully!',
        quizzes,
      });
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      return res.status(500).json({ message: 'An error occurred while fetching quizzes.' });
    }
  });
  


  
  




module.exports = router;
