const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  quiz: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quiz', 
    required: true 
  },  // Reference to the Quiz model
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },  // Reference to the Student model
  questions: [{
    question: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'MCQQuestion', 
      required: true 
    },  // Reference to each question in the quiz
    optedAnswer: { 
      type: String, 
      required: true 
    },  // Answer chosen by the student
    correctAnswer: { 
      type: String, 
      required: true 
    }   // Correct answer to the question
  }],
  score: { 
    type: Number, 
    default: 0 
  }  // Store the student's score for this attempt
}, { timestamps: true });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
