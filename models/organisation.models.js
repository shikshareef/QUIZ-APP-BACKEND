const mongoose = require('mongoose');
const { generateCustomId } = require('./helper');

const organizationSchema = new mongoose.Schema({
  organizationId: { type: String, unique: true },
  name: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]  // Add this section for students
}, { timestamps: true });

// Pre-save hook to generate organizationId
organizationSchema.pre('save', async function (next) {
  if (!this.organizationId) {
    this.organizationId = await generateCustomId('ORG');
  }
  next();
});

module.exports = mongoose.model('Organization', organizationSchema);
