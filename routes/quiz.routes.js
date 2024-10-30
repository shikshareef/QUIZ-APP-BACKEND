const express = require('express');
const router = express.Router();
const Quiz = require('../models/quiz.models')
const verifyStudentToken = require('./student.middleware')
const Student = require('../models/students.models')
const verifyFaculty = require('./facutly.middleware')
const Faculty = require('../models/faculty.models')
const QuizAttempt = require('../models/quizAttempted.models')
const MCQQuestion = require('../models/questions.models')

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

router.post('/submit-quiz', verifyStudentToken, async (req, res) => {
  const { quizId, answers, score } = req.body;
  const studentId = req.student.studentId;

  // Validate input
  if (!quizId || !answers || score == null || !Array.isArray(answers)) {
    return res.status(400).json({ message: 'Please provide quizId, answers, and score in the correct format.' });
  }

  try {
    // Fetch the quiz by quizId
    const quiz = await Quiz.findById(quizId).populate('questions');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });

    // Check if the student is already in the quiz participants
    if (!quiz.studentParticipants.includes(studentId)) {
      quiz.studentParticipants.push(studentId);
      await quiz.save();
    }

    // Fetch the student by studentId
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    // Check if the quiz has already been taken by the student
    const quizTaken = student.quizzesTaken.find((q) => q.quiz.toString() === quizId);
    if (!quizTaken) {
      // Add new quiz attempt and score to quizzesTaken array
      student.quizzesTaken.push({ quiz: quizId, score });
      await student.save();
    } else {
      // Update existing score if the quiz has already been taken
      quizTaken.score = score;
      await student.save();
    }

    // Prepare question responses with chosen and correct answers
    const questionResponses = quiz.questions.map((question, index) => {
      const answerEntry = answers.find((ans) => Object.keys(ans)[0] === String(index + 1));
      const optedAnswer = answerEntry ? answerEntry[index + 1] : '-1';
      return {
        question: question._id,
        optedAnswer,
        correctAnswer: question.correctAnswer // Assuming `correctAnswer` exists in the question model
      };
    });

    // Create and save the quiz attempt
    const quizAttempt = new QuizAttempt({
      quiz: quiz._id,
      student: studentId,
      questions: questionResponses,
      score
    });
    await quizAttempt.save();

    return res.status(200).json({
      message: 'Quiz submitted successfully!',
      studentId : quizAttempt.student,
      submissionId: quizAttempt._id,
      score,
      responses: questionResponses
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return res.status(500).json({ message: 'An error occurred while submitting the quiz.' });
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


  router.delete('/delete-quiz', verifyFaculty, async (req, res) => {
    const { quizId } = req.body; // Get quizId from request body
    const facultyId = req.faculty.facultyId; // Get facultyId from middleware
  
    // Validate input
    if (!quizId) {
      return res.status(400).json({ message: 'Please provide quizId in the request body.' });
    }
  
    try {
      // Find the quiz by quizId
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found.' });
      }
  
      // Delete the quiz
      await Quiz.findByIdAndDelete(quizId);
  
      // Remove the quiz reference from the faculty's quizzes array
      await Faculty.findByIdAndUpdate(facultyId, {
        $pull: { quizzes: quizId }
      });
  
      return res.status(200).json({
        message: 'Quiz and its reference in faculty deleted successfully!',
        quizId
      });
    } catch (error) {
      console.error('Error deleting quiz or removing reference:', error);
      return res.status(500).json({ message: 'An error occurred while deleting the quiz.' });
    }
  });


  router.get('/students/quizzes-attempted', verifyStudentToken, async (req, res) => {
    const studentId = req.student.studentId;  // Getting studentId from the middleware
  
    try {
      // Fetch student document
      const student = await Student.findById(studentId)
        .populate({
          path: 'quizzesTaken.quiz',  // Populate quizzes in quizzesTaken
          populate: [
            { path: 'faculty', select: 'name' },  // Populate faculty name
            { path: 'class', select: 'name' },    // Populate class name
          ],
          select: 'quizId title faculty class questions'  // Select necessary fields, including 'questions' to calculate totalMarks
        });
  
      if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
      }
  
      // Prepare the response array, checking if the quiz is valid (i.e., not null)
      const quizzesAttempted = student.quizzesTaken
        .filter(item => item.quiz) // Filter out null quizzes
        .map(item => {
          const quiz = item.quiz;
          return {
            quizId: quiz.quizId,
            quiz_Id : quiz._id,
            title: quiz.title,
            facultyName: quiz.faculty ? quiz.faculty.name : 'Unknown Faculty',  // Check if faculty exists
            className: quiz.class ? quiz.class.name : 'Unknown Class',  // Check if class exists
            score: item.score,
            totalMarks: quiz.questions.length // Calculate totalMarks by the number of questions
          };
        });
  
      return res.status(200).json({
        message: 'Quizzes attempted fetched successfully!',
        quizzes: quizzesAttempted
      });
  
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      return res.status(500).json({ message: 'An error occurred while fetching quizzes.' });
    }
  });

  
  

  router.post('/faculty/students-participated', verifyFaculty, async (req, res) => {
    const facultyId = req.faculty.facultyId; // Get facultyId from middleware
    const { quizId } = req.body; // Get quizId from request body

    try {
      // Find the faculty and ensure the quiz belongs to the faculty
      const faculty = await Faculty.findById(facultyId).populate('quizzes');
      
      if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found.' });
      }

      // Check if the quizId belongs to one of the quizzes created by the faculty
      const quiz = faculty.quizzes.find(quiz => quiz._id.toString() === quizId);
      if (!quiz) {
        return res.status(403).json({ message: 'You do not have permission to view this quiz.' });
      }

      // Fetch quiz details to get the total number of questions (total marks)
      const fullQuiz = await Quiz.findById(quizId).populate('questions');
      const totalMarks = fullQuiz.questions.length; // Total marks = number of questions

      // Find students who have participated in this quiz
      const students = await Student.find({
        'quizzesTaken.quiz': quizId // Match quizzes in student's quizzesTaken array
      }).populate('quizzesTaken.quiz', 'title'); // Populate the quiz details for better context

      // Prepare the result array with student names, regNo, quiz title, score, and total marks
      const studentParticipation = students.map(student => {
        // Filter quizzes taken by the student that match the quizId
        const quizzesTakenByThisQuiz = student.quizzesTaken.filter(quizData => 
          quizData.quiz && quizData.quiz._id.toString() === quizId  // Ensure quizData.quiz is not null
        );

        // Return each quiz data for the student
        return quizzesTakenByThisQuiz.map(quizData => ({
          studentName: student.name,
          regNo: student.regNo,
          quizTitle: quizData.quiz ? quizData.quiz.title : 'Unknown',  // Add a fallback in case quizData.quiz is null
          score: quizData.score,
          totalMarks // Include the total marks (length of the questions array)
        }));
      }).flat(); // Flatten the array if students have taken multiple quizzes

      return res.status(200).json({
        message: 'Student participation data fetched successfully!',
        data: studentParticipation
      });

    } catch (error) {
      console.error('Error fetching student participation:', error);
      return res.status(500).json({ message: 'An error occurred while fetching data.' });
    }
});

router.post('/quiz-attemptedInfo', verifyStudentToken, async (req, res) => {
  const { quizId } = req.body; // Get quizId from query parameters
  const studentId = req.student.studentId; // Get studentId from the verified token
  // Validate input
  if (!quizId) {
    return res.status(400).json({ message: 'Please provide the quizId in the query parameters.' });
  }

  try {
    // Find the quiz attempt based on quizId and studentId
    const quizAttempt = await QuizAttempt.findOne({ quiz: quizId, student: studentId })
      .populate('questions.question'); // Populate the questions to get their texts

    if (!quizAttempt) {
      return res.status(404).json({ message: 'Quiz attempt not found.' });
    }

    // Prepare the response with question details, including options
    const questionDetails = await Promise.all(quizAttempt.questions.map(async (q) => {
      // Find the corresponding MCQQuestion to get the options
      const mcqQuestion = await MCQQuestion.findById(q.question).select('questionText options');

      // Create an options object
      const options = {
        opt1: mcqQuestion.options.opt1,
        opt2: mcqQuestion.options.opt2,
        opt3: mcqQuestion.options.opt3,
        opt4: mcqQuestion.options.opt4,
      };

      return {
        questionId: mcqQuestion._id, // Get question ID
        questionText: mcqQuestion.questionText, // Get question text
        optedAnswer: options[`opt${q.optedAnswer}`], // Get the text of the opted answer
        correctAnswer: options[`opt${q.correctAnswer}`], // Get the text of the correct answer
        options, // Include all options in the response
      };
    }));

    return res.status(200).json({
      message: 'Quiz attempt details fetched successfully!',
      quizId: quizAttempt.quiz,
      studentId: quizAttempt.student,
      score: quizAttempt.score,
      questions: questionDetails // Include the details of the questions
    });

  } catch (error) {
    console.error('Error fetching quiz attempt:', error);
    return res.status(500).json({ message: 'An error occurred while fetching quiz attempt details.' });
  }
});




  
  
  module.exports = router;
  