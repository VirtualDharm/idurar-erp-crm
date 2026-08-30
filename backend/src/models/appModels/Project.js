const mongoose = require('mongoose');

/** An installation, created by converting an accepted quotation.
 *
 *  Milestones and the payment schedule are embedded arrays rather than separate
 *  collections: they are always read together with the project, never queried
 *  on their own, and are bounded (10 and ~3 entries).
 */

// The Indian rooftop install sequence, ending in subsidy disbursal — the order
// matters because DISCOM inspection gates the net meter, which gates subsidy.
const DEFAULT_MILESTONES = [
  'Material procurement confirmed',
  'Material delivered to site',
  'Structure and panel installation complete',
  'Inverter and wiring complete',
  'Testing and commissioning complete',
  'DISCOM inspection application submitted',
  'DISCOM inspection passed',
  'Net meter installed',
  'Subsidy application submitted',
  'Subsidy disbursed',
];

const projectSchema = new mongoose.Schema({
  removed: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },

  projectName: { type: String, required: true },
  lead: { type: mongoose.Schema.ObjectId, ref: 'Lead', required: true },
  quotation: { type: mongoose.Schema.ObjectId, ref: 'Quotation' },

  systemSizeKw: { type: Number, required: true },
  location: { type: String },
  state: { type: String },
  projectValue: { type: Number, default: 0 },
  projectManager: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  status: {
    type: String,
    default: 'In Progress',
    enum: ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
  },

  milestones: [
    {
      title: { type: String, required: true },
      done: { type: Boolean, default: false },
      completedAt: { type: Date },
      proofUrl: { type: String },
    },
  ],

  // Subsidy paperwork. Fixed keys (not a free-form array) because the portal
  // requires exactly this set and the tracker checks them by name.
  documents: {
    aadharCard: { type: String },
    electricityBill: { type: String },
    propertyProof: { type: String },
    bankPassbook: { type: String },
    installationCertificate: { type: String },
    inspectionReport: { type: String },
  },

  paymentSchedule: [
    {
      milestone: { type: String, required: true },
      amountDue: { type: Number, required: true },
      dueDate: { type: Date },
      status: { type: String, default: 'Pending', enum: ['Pending', 'Received', 'Overdue'] },
      amountReceived: { type: Number, default: 0 },
      receivedDate: { type: Date },
    },
  ],

  // --- subsidy tracking ---
  expectedSubsidy: { type: Number, default: 0 },
  portalStatus: {
    type: String,
    default: 'Not Started',
    enum: ['Not Started', 'Applied', 'Under Review', 'Approved', 'Disbursed', 'Rejected'],
  },
  netMeterStatus: {
    type: String,
    default: 'Not Applied',
    enum: ['Not Applied', 'Applied', 'Inspection Done', 'Installed'],
  },
  subsidyAppliedDate: { type: Date },

  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

projectSchema.index({ status: 1, created: -1 });
projectSchema.index({ lead: 1 });

module.exports = mongoose.model('Project', projectSchema);
module.exports.DEFAULT_MILESTONES = DEFAULT_MILESTONES;
