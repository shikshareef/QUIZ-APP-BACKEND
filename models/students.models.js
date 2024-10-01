const mongoose = require('mongoose');
const { generateCustomId } = require('./helper');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true },
  regNo: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }], // Array for multiple class references
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }, // Reference to the organization
  quizzesTaken: [{ 
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    score: Number
  }]
}, { timestamps: true });

// Pre-save hook to generate studentId
studentSchema.pre('save', async function (next) {
  if (!this.studentId) {
    this.studentId = await generateCustomId('STU');
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);
