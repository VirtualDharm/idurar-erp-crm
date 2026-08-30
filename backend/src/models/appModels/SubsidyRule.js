const mongoose = require('mongoose');

/** Per-state rooftop subsidy. Central (PM Surya Ghar) is national and lives in
 *  settings; this table only holds the state top-up, which varies widely
 *  (Gujarat ₹10k/kW vs Delhi ₹2k/kW) and is always capped. */
const subsidyRuleSchema = new mongoose.Schema({
  removed: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  state: { type: String, required: true, trim: true },
  subsidyPerKw: { type: Number, required: true, default: 0 },
  maxCap: { type: Number, required: true, default: 0 },
  created: { type: Date, default: Date.now },
});

subsidyRuleSchema.index({ state: 1 });

module.exports = mongoose.model('SubsidyRule', subsidyRuleSchema);
