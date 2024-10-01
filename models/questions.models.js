const mongoose = require('mongoose');

const mcqQuestionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },  // Reference to the Quiz model
  questionText: { type: String, required: true },  // The question being asked
  options: { type: [String], required: true },  // The list of options for the MCQ
  correctAnswer: { type: String, required: true }  // The correct answer for the question (from the options)
}, { timestamps: true });

module.exports = mongoose.model('MCQQuestion', mcqQuestionSchema);
