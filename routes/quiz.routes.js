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

  router.post('/submit-marks', verifyStudentToken, async (req, res) => {
    const { quizId, score } = req.body;
    const studentId = req.student.studentId; // Extracting studentId from verified token
  
    // Validate input
    if (!quizId || score == null) {
      return res.status(400).json({ message: 'Please provide quizId and score in the request body.' });
    }
  
    try {
      // Find the quiz by quizId
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found.' });
      }
  
      // Check if the student is already in the quiz participants
      if (!quiz.studentParticipants.includes(req.student._id)) {
        // Push the studentId into studentParticipants array
        quiz.studentParticipants.push(studentId);
        await quiz.save(); // Save the updated quiz document
      }
  
      // Find the student by studentId
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
      }
  
      // Check if the quiz has already been taken by the student
      const quizTaken = student.quizzesTaken.find(q => q.quiz.toString() === quizId);
      if (!quizTaken) {
        // Push the quizId and score to the student's quizzesTaken array
        student.quizzesTaken.push({ quiz: quizId, score });
        await student.save(); // Save the updated student document
      } else {
        // If the quiz is already taken, update the score
        quizTaken.score = score;
        await student.save(); // Save the updated score in the student document
      }
  
      // Send success response
      return res.status(200).json({
        message: 'Quiz and marks submitted successfully!',
        quizId,
        studentId,
        score,
      });
    } catch (error) {
      console.error('Error submitting quiz marks:', error);
      return res.status(500).json({ message: 'An error occurred while submitting quiz marks.' });
    }
  });

  router.post('/check-quiz-submission', verifyStudentToken, async (req, res) => {
    const { quizId } = req.body;
    const studentId = req.student.studentId; // Extracting studentId from verified token
  
    // Validate input
    if (!quizId) {
      return res.status(400).json({ message: 'Please provide quizId in the request body.' });
    }
  
    try {
      // Find the student by studentId
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
      }
  
      // Check if the quizId is already present in the quizzesTaken array
      const quizTaken = student.quizzesTaken.find(q => q.quiz.toString() === quizId);
      if (quizTaken) {
        // Quiz already submitted, so return an error message
        return res.status(400).json({
          message: 'Quiz has already been submitted.',
          quizId,
          score: quizTaken.score, // Optionally return the previous score
        });
      }
  
      // Quiz not yet submitted, allow submission
      return res.status(200).json({
        message: 'Quiz not submitted yet. Proceed with the submission.',
        quizId,
      });
    } catch (error) {
      console.error('Error checking quiz submission:', error);
      return res.status(500).json({ message: 'An error occurred while checking quiz submission.' });
    }
  });
  
  module.exports = router;
  