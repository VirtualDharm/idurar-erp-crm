const mongoose = require('mongoose');

/** A prospective rooftop-solar customer, moving through the sales pipeline.
 *  `status` drives the kanban board; `followUpDate` powers the overdue list on
 *  the dashboard. Notes are embedded (small, always read with the lead). */
const leadSchema = new mongoose.Schema({
  removed: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },

  name: { type: String, required: true, trim: true },
  mobile: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },

  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },

  monthlyBill: { type: Number, default: 0 },
  roofArea: { type: Number },
  roofOwnership: { type: String, enum: ['Owned', 'Rented', 'Society'], default: 'Owned' },

  // "Website Solar Calculator" is set by the public widget endpoint.
  leadSource: {
    type: String,
    default: 'Manual',
    enum: ['Manual', 'Referral', 'Website Solar Calculator', 'Walk-in', 'Phone', 'Social Media'],
  },
  estimatedSavings: { type: Number },

  status: {
    type: String,
    default: 'New',
    enum: ['New', 'Contacted', 'Survey Scheduled', 'Quote Sent', 'Negotiation', 'Won', 'Lost'],
  },
  followUpDate: { type: Date },
  assignedTo: { type: mongoose.Schema.ObjectId, ref: 'Admin' },

  notes: [
    {
      text: { type: String, required: true },
      createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
      created: { type: Date, default: Date.now },
    },
  ],

  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

leadSchema.index({ status: 1, removed: 1 });
leadSchema.index({ followUpDate: 1 });

module.exports = mongoose.model('Lead', leadSchema);
