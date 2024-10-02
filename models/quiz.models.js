const mongoose = require('mongoose');
const { generateCustomId } = require('./helper');

// Regular expression to validate time in HH:mm format
const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/; // Matches '00:00' to '23:59'

const quizSchema = new mongoose.Schema({
  quizId: { type: String, unique: true },
  title: { type: String, required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MCQQuestion' }], // Make sure to reference the correct question model
  startTime: { 
    type: String, // Change to String to store time as 'HH:mm'
    required: true,
    validate: {
      validator: function(v) {
        return timeRegex.test(v);
      },
      message: props => `${props.value} is not a valid time format! Please use HH:mm.`
    }
  },
  endTime: { 
    type: String, // Change to String to store time as 'HH:mm'
    required: true,
    validate: {
      validator: function(v) {
        return timeRegex.test(v);
      },
      message: props => `${props.value} is not a valid time format! Please use HH:mm.`
    }
  },
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



module.exports = mongoose.model('Quiz', quizSchema);
