const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const methods = createCRUDController('Lead');
const Lead = mongoose.model('Lead');

/** Append a timeline note. Notes are never edited or deleted — a follow-up log
 *  you can rewrite is worthless when two salespeople disagree about what was
 *  promised. */
methods.addNote = async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, result: null, message: 'Note text is required.' });
  }

  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { $push: { notes: { text: text.trim(), createdBy: req.admin._id } }, $set: { updated: Date.now() } },
    { new: true }
  );
  if (!lead) {
    return res.status(404).json({ success: false, result: null, message: 'Lead not found.' });
  }

  return res.status(200).json({ success: true, result: lead, message: 'Note added' });
};

/** Move a lead between pipeline stages (kanban drag, or the detail dropdown). */
methods.updateStatus = async (req, res) => {
  const { status, followUpDate } = req.body;
  const stages = Lead.schema.path('status').enumValues;

  if (status && !stages.includes(status)) {
    return res.status(400).json({
      success: false, result: null, message: `status must be one of: ${stages.join(', ')}`,
    });
  }

  const update = { updated: Date.now() };
  if (status) update.status = status;
  if (followUpDate !== undefined) update.followUpDate = followUpDate || null;

  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { $set: update },
    { new: true }
  );
  if (!lead) {
    return res.status(404).json({ success: false, result: null, message: 'Lead not found.' });
  }

  return res.status(200).json({ success: true, result: lead, message: 'Lead updated' });
};

module.exports = methods;
