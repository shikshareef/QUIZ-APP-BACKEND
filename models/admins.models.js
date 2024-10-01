const mongoose = require('mongoose');
const { generateCustomId } = require('./helper');

const adminSchema = new mongoose.Schema({
  adminId: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  organizations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }] // Array of references to organizations created by the admin
}, { timestamps: true });

// Pre-save hook to generate adminId
adminSchema.pre('save', async function (next) {
  if (!this.adminId) {
    this.adminId = await generateCustomId('ADM');
  }
  next();
});

module.exports = mongoose.model('Admin', adminSchema);
