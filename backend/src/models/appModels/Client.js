const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },

  name: {
    type: String,
    required: true,
  },
  phone: String,
  country: String,
  address: String,
  email: String,

  // Sales pipeline stage of this customer (same stages as the Leads board).
  stage: {
    type: String,
    default: 'New',
    enum: ['New', 'Contacted', 'Survey Scheduled', 'Quote Sent', 'Negotiation', 'Won', 'Lost'],
  },
  source: String, // where the lead came from (fb, ig, referral, …)
  salesPerson: String, // who on the team handles them
  notes: String, // follow-ups, system kW, quotation — free text
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  assigned: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

schema.index({ stage: 1, removed: 1 });
schema.index({ phone: 1 });

schema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Client', schema);
