const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: false,
  },

  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
  },
  name: { type: String, required: true },
  surname: { type: String },
  photo: {
    type: String,
    trim: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  // Roles mirror the four job functions a solar business actually has. `owner`
  // is the account holder (created by setup.js) and is never removable; the rest
  // are assigned per team member. Route access is enforced by hasRole().
  role: {
    type: String,
    default: 'sales',
    enum: ['owner', 'admin', 'sales', 'technician', 'accounts'],
  },
});

adminSchema.index({ email: 1 });

module.exports = mongoose.model('Admin', adminSchema);
