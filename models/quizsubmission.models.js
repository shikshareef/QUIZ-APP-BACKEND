const mongoose = require('mongoose');

const quizSubmissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    answer: String
  }],
  score: Number
}, { timestamps: true });

module.exports = mongoose.model('QuizSubmission', quizSubmissionSchema);
