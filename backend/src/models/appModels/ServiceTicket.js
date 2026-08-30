const mongoose = require('mongoose');

/** Post-installation complaint against a commissioned project. */
const serviceTicketSchema = new mongoose.Schema({
  removed: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },

  ticketNumber: { type: String, unique: true },
  project: { type: mongoose.Schema.ObjectId, ref: 'Project', required: true },
  issueType: {
    type: String,
    required: true,
    enum: [
      'Inverter Fault', 'Panel Fault', 'Physical Damage', 'Low Generation',
      'Net Meter Issue', 'Wiring Issue', 'Other',
    ],
  },
  description: { type: String },
  technician: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  status: { type: String, default: 'Open', enum: ['Open', 'In Progress', 'Resolved', 'Closed'] },
  attachments: [{ type: String }],
  reportedOn: { type: Date, default: Date.now },
  resolvedOn: { type: Date },

  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

serviceTicketSchema.index({ status: 1, reportedOn: -1 });

module.exports = mongoose.model('ServiceTicket', serviceTicketSchema);
