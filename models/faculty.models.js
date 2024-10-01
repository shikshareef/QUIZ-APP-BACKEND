const mongoose = require('mongoose');
const {generateCustomId}  = require('./helper');

const facultySchema = new mongoose.Schema({
  facultyId: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  role: { type: String, default: 'faculty' },
  quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }]
}, { timestamps: true });

// Pre-save hook to generate facultyId
facultySchema.pre('save', async function (next) {
  if (!this.facultyId) {
    this.facultyId = await generateCustomId('FAC');
  }
  next();
});

module.exports = mongoose.model('Faculty', facultySchema);
