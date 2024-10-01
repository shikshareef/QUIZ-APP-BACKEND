const mongoose = require('mongoose');
const { generateCustomId } = require('./helper');

const quizSchema = new mongoose.Schema({
  quizId: { type: String, unique: true },
  title: { type: String, required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MCQQuestion' }], // Make sure to reference the correct question model
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  scheduledDate: { type: Date, required: true },  // New field for scheduling the quiz
  active: { type: Boolean, default: true },  // Active state, default is true
  studentParticipants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }] // Reference to Student model
}, { timestamps: true });

// Pre-save hook to generate quizId
quizSchema.pre('save', async function (next) {
  if (!this.quizId) {
    this.quizId = await generateCustomId('QUI');
  }
  next();
});

// Middleware to check if the quiz is still active before every save or update
quizSchema.pre('save', function(next) {
  const currentTime = new Date();
  
  // If the current time is greater than the endTime, mark the quiz as inactive
  if (currentTime > this.endTime) {
    this.active = false;
  } else {
    this.active = true;
  }
  
  next();
});

// Optional: You can also add a method to manually update the active status
quizSchema.methods.updateActiveStatus = function() {
  const currentTime = new Date();
  if (currentTime > this.endTime) {
    this.active = false;
  } else {
    this.active = true;
  }
  return this.save();  // Save the updated quiz document
};

module.exports = mongoose.model('Quiz', quizSchema);
