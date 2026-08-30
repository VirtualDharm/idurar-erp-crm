const mongoose = require('mongoose');

/** Priced proposal for a lead.
 *
 *  Totals are stored, not computed on read: subsidy rules and product rates
 *  change over time, and a quote the customer accepted must keep the numbers it
 *  was accepted at. `quotationController` recalculates them on every write.
 */
const quotationSchema = new mongoose.Schema({
  removed: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },

  quoteNumber: { type: String, unique: true },
  lead: { type: mongoose.Schema.ObjectId, ref: 'Lead', required: true },
  systemSizeKw: { type: Number, required: true, default: 3 },
  validityDate: { type: Date },
  status: {
    type: String,
    default: 'Draft',
    enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'],
  },

  items: [
    {
      product: { type: mongoose.Schema.ObjectId, ref: 'Product' },
      itemName: { type: String, required: true },
      brand: { type: String },
      quantity: { type: Number, required: true, default: 1 },
      unit: { type: String, default: 'Nos' },
      rate: { type: Number, required: true, default: 0 },
      gstPercent: { type: Number, default: 18 },
      lineTotal: { type: Number, default: 0 }, // rate*qty incl. GST
    },
  ],

  paymentTemplate: { type: mongoose.Schema.ObjectId, ref: 'PaymentTemplate' },
  paymentTerms: { type: String },
  advancePercent: { type: Number, default: 30 },
  deliveryPercent: { type: Number, default: 50 },
  commissioningPercent: { type: Number, default: 20 },

  // --- computed on save (see quotationController.calculate) ---
  subTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  centralSubsidy: { type: Number, default: 0 },
  stateSubsidy: { type: Number, default: 0 },
  netCustomerCost: { type: Number, default: 0 },

  notes: { type: String },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

quotationSchema.index({ lead: 1 });
quotationSchema.index({ status: 1, created: -1 });

module.exports = mongoose.model('Quotation', quotationSchema);
