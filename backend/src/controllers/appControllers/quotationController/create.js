const mongoose = require('mongoose');
const calculate = require('./calculate');

const Quotation = mongoose.model('Quotation');
const Lead = mongoose.model('Lead');

/** Quote numbers are per-year sequences (QT-2026-0001) — readable to customers
 *  and sortable, unlike an ObjectId. */
const nextQuoteNumber = async () => {
  const year = new Date().getFullYear();
  const last = await Quotation.findOne({ quoteNumber: new RegExp(`^QT-${year}-`) })
    .sort({ quoteNumber: -1 })
    .select('quoteNumber');
  const seq = last ? parseInt(last.quoteNumber.split('-')[2], 10) + 1 : 1;
  return `QT-${year}-${String(seq).padStart(4, '0')}`;
};

const create = async (req, res) => {
  const body = req.body;

  const lead = await Lead.findOne({ _id: body.lead, removed: false });
  if (!lead) {
    return res.status(400).json({ success: false, result: null, message: 'Lead not found.' });
  }

  const priced = await calculate({
    items: body.items || [],
    systemSizeKw: body.systemSizeKw,
    state: body.state || lead.state,
  });

  const result = await new Quotation({
    ...body,
    ...priced,
    quoteNumber: await nextQuoteNumber(),
    createdBy: req.admin._id,
  }).save();

  // A quote going out is a pipeline event — reflect it on the lead so the
  // kanban board doesn't lie about where the deal stands.
  if (['New', 'Contacted', 'Survey Scheduled'].includes(lead.status)) {
    lead.status = 'Quote Sent';
    await lead.save();
  }

  return res.status(200).json({ success: true, result, message: 'Quotation created' });
};

module.exports = create;
module.exports.nextQuoteNumber = nextQuoteNumber;
