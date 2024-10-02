const express = require('express');
const router = express.Router();
const Quiz = require('../models/quiz.models')
const verifyStudentToken = require('./student.middleware')
const Student = require('../models/students.models')

router.post('/quiz-details', verifyStudentToken, async (req, res) => {
    const { quizId } = req.body; // Get the quizId from the request body
    const studentId = req.student.studentId; // Get studentId from the verified token
  
    // Validate input
    if (!quizId) {
      return res.status(400).json({ message: 'Please provide the quizId in the request body.' });
    }
  
    try {
      // Find the quiz by quizId and populate relevant fields
      const quiz = await Quiz.findById(quizId)
        .populate('faculty') // Populate faculty details
        .populate('class')   // Populate class details
        .populate('questions'); // Populate questions
  
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found.' });
      }
  
      // Fetch student details using studentId
      const student = await Student.findById(studentId).select('studentId regNo name email'); // Fetch student details
  
      if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
      }
  
      // Return the quiz and student details
      return res.status(200).json({
        message: 'Quiz details and student information fetched successfully!',
        quiz,   // Quiz details
        student // Student information
      });
    } catch (error) {
      console.error('Error fetching quiz details:', error);
      return res.status(500).json({ message: 'An error occurred while fetching quiz details.' });
    }
  });
  
  module.exports = router;
  