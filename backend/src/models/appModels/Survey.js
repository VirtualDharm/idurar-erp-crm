const mongoose = require('mongoose');

/** Site survey — the technician's field visit that turns a lead's guess into
 *  real numbers. `recommendedKw` is derived from consumption on save so the
 *  quote and the survey can never drift apart. */
const surveySchema = new mongoose.Schema({
  removed: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },

  lead: { type: mongoose.Schema.ObjectId, ref: 'Lead', required: true },
  surveyDate: { type: Date, required: true },
  technician: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  status: { type: String, default: 'Scheduled', enum: ['Scheduled', 'Completed', 'Cancelled'] },

  roofArea: { type: Number },
  shading: { type: String, enum: ['None', 'Partial', 'Heavy'], default: 'None' },
  connectionType: { type: String, enum: ['Single-phase', 'Three-phase'], default: 'Single-phase' },
  sanctionedLoad: { type: Number },
  monthlyUnits: { type: Number },
  recommendedKw: { type: Number },

  latitude: { type: Number },
  longitude: { type: Number },
  photos: [{ type: String }],
  notes: { type: String },

  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

// ~120 units/month per kW is the standard Indian rooftop rule of thumb; roof
// area caps it (~100 sqft per kW) because you cannot install what won't fit.
surveySchema.pre('save', function (next) {
  if (this.monthlyUnits) {
    const byConsumption = this.monthlyUnits / 120;
    const byRoof = this.roofArea ? this.roofArea / 100 : byConsumption;
    this.recommendedKw = Math.round(Math.min(byConsumption, byRoof) * 10) / 10;
  }
  next();
});

surveySchema.index({ lead: 1 });
surveySchema.index({ status: 1, surveyDate: -1 });

module.exports = mongoose.model('Survey', surveySchema);
