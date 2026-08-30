const mongoose = require('mongoose');
const calculate = require('./calculate');

const Quotation = mongoose.model('Quotation');
const Lead = mongoose.model('Lead');

/** Any write re-prices the quote — otherwise editing a line item would leave
 *  stale totals that the customer-facing PDF would happily print. */
const update = async (req, res) => {
  const body = req.body;

  const existing = await Quotation.findOne({ _id: req.params.id, removed: false });
  if (!existing) {
    return res.status(404).json({ success: false, result: null, message: 'Quotation not found.' });
  }

  const lead = await Lead.findOne({ _id: body.lead || existing.lead });

  const priced = await calculate({
    items: body.items || existing.items,
    systemSizeKw: body.systemSizeKw ?? existing.systemSizeKw,
    state: body.state || lead?.state,
  });

  const result = await Quotation.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { $set: { ...body, ...priced, updated: Date.now() } },
    { new: true, runValidators: true }
  );

  return res.status(200).json({ success: true, result, message: 'Quotation updated' });
};

module.exports = update;
