const mongoose = require('mongoose');

/** Annual maintenance contract on an installed system. `expiryDate` drives the
 *  renewal reminder, which fires `amcReminderDays` before it. */
const amcContractSchema = new mongoose.Schema({
  removed: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },

  contractNumber: { type: String, unique: true },
  project: { type: mongoose.Schema.ObjectId, ref: 'Project', required: true },
  startDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  amount: { type: Number, default: 0 },
  visitsPerYear: { type: Number, default: 2 },
  status: { type: String, default: 'Active', enum: ['Active', 'Expiring Soon', 'Expired', 'Cancelled'] },
  notes: { type: String },

  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

amcContractSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('AmcContract', amcContractSchema);
