const mongoose = require('mongoose');

/** Reusable payment-split presets (e.g. 30-50-20). Selecting one on a quotation
 *  fills the three percentages; converting that quote to a project turns them
 *  into dated payment milestones. */
const paymentTemplateSchema = new mongoose.Schema({
  removed: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  templateName: { type: String, required: true, trim: true },
  advancePercent: { type: Number, required: true, default: 30 },
  deliveryPercent: { type: Number, required: true, default: 50 },
  commissioningPercent: { type: Number, required: true, default: 20 },
  created: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PaymentTemplate', paymentTemplateSchema);
