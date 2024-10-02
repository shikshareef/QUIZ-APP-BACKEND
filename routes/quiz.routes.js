const express = require('express');
const router = express.Router();
const Quiz = require('../models/quiz.models')
const verifyStudentToken = require('./student.middleware')

router.get('/quiz-details', verifyStudentToken ,  async (req, res) => {
    const { quizId } = req.body; // Get the quizId from the request body
  
    // Validate input
    if (!quizId) {
      return res.status(400).json({ message: 'Please provide the quizId in the request body.' });
    }
  
    try {
      // Find the quiz by quizId
      const quiz = await Quiz.findById(quizId)
        .populate('faculty') // Populate faculty details if needed
        .populate('class')   // Populate class details if needed
        .populate('questions'); // Populate questions if needed
  
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found.' });
      }
  
      // Return the quiz details
      return res.status(200).json({
        message: 'Quiz details fetched successfully!',
        quiz,
      });
    } catch (error) {
      console.error('Error fetching quiz details:', error);
      return res.status(500).json({ message: 'An error occurred while fetching quiz details.' });
    }
  });

  module.exports = router;
  