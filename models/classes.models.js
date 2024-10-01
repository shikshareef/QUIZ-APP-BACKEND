const mongoose = require('mongoose');
const {generateCustomId}  = require('./helper');

const classSchema = new mongoose.Schema({
  classId: { type: String, unique: true },
  name: { type: String, required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }]
}, { timestamps: true });

// Pre-save hook to generate classId
classSchema.pre('save', async function (next) {
  if (!this.classId) {
    this.classId = await generateCustomId('CLA');
  }
  next();
});

module.exports = mongoose.model('Class', classSchema);
