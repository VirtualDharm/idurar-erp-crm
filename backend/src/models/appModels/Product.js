const mongoose = require('mongoose');

/** Catalog of sellable items (panels, inverters, kits) used by quotation line
 *  items. GST lives per item because a 550W panel (12%) and an inverter (18%)
 *  attract different rates on the same quote. */
const productSchema = new mongoose.Schema({
  removed: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  itemName: { type: String, required: true, trim: true },
  brand: { type: String, trim: true },
  unit: { type: String, default: 'Nos', trim: true },
  defaultRate: { type: Number, required: true, default: 0 },
  gstPercent: { type: Number, default: 18 },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

productSchema.index({ itemName: 1 });

module.exports = mongoose.model('Product', productSchema);
