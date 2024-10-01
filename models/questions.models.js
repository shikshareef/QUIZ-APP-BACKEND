const mongoose = require('mongoose');

const MCQQuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: {
    opt1: { type: String, required: true },
    opt2: { type: String, required: true },
    opt3: { type: String, required: true },
    opt4: { type: String, required: true },
  },
  correctAnswer: { type: Number, required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true }
});

const MCQQuestion = mongoose.model('MCQQuestion', MCQQuestionSchema);

module.exports = MCQQuestion; // Ensure you're exporting the model
