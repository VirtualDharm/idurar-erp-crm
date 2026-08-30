const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const methods = createCRUDController('Project');
const Project = mongoose.model('Project');

/** Tick or untick one installation milestone.
 *
 *  Reaching "Subsidy application submitted" also stamps `subsidyAppliedDate`,
 *  which is what the subsidy tracker ages against to flag stuck applications —
 *  otherwise "stuck for 60 days" has no start date to measure from.
 */
methods.updateMilestone = async (req, res) => {
  const { index, done, proofUrl } = req.body;

  const project = await Project.findOne({ _id: req.params.id, removed: false });
  if (!project) {
    return res.status(404).json({ success: false, result: null, message: 'Project not found.' });
  }
  const milestone = project.milestones[index];
  if (!milestone) {
    return res.status(400).json({ success: false, result: null, message: 'No such milestone.' });
  }

  if (typeof done === 'boolean') {
    milestone.done = done;
    milestone.completedAt = done ? new Date() : undefined;
  }
  if (proofUrl) milestone.proofUrl = proofUrl;

  if (milestone.title === 'Subsidy application submitted' && milestone.done) {
    project.subsidyAppliedDate = project.subsidyAppliedDate || new Date();
    if (project.portalStatus === 'Not Started') project.portalStatus = 'Applied';
  }
  if (milestone.title === 'Net meter installed' && milestone.done) {
    project.netMeterStatus = 'Installed';
  }
  if (milestone.title === 'Subsidy disbursed' && milestone.done) {
    project.portalStatus = 'Disbursed';
  }
  // Every box ticked means the install is finished — don't make ops also
  // remember to flip the status dropdown.
  if (project.milestones.every((m) => m.done)) project.status = 'Completed';

  project.updated = Date.now();
  await project.save();

  return res.status(200).json({ success: true, result: project, message: 'Milestone updated' });
};

/** Record money against one payment milestone. */
methods.recordPayment = async (req, res) => {
  const { index, amountReceived, receivedDate } = req.body;

  const project = await Project.findOne({ _id: req.params.id, removed: false });
  if (!project) {
    return res.status(404).json({ success: false, result: null, message: 'Project not found.' });
  }
  const entry = project.paymentSchedule[index];
  if (!entry) {
    return res.status(400).json({ success: false, result: null, message: 'No such payment entry.' });
  }

  entry.amountReceived = Number(amountReceived) || 0;
  entry.receivedDate = receivedDate ? new Date(receivedDate) : new Date();
  // Partial payments stay Pending — "Received" must mean the money is fully in,
  // or the outstanding figure on the dashboard becomes fiction.
  entry.status = entry.amountReceived >= entry.amountDue ? 'Received' : 'Pending';

  project.updated = Date.now();
  await project.save();

  return res.status(200).json({ success: true, result: project, message: 'Payment recorded' });
};

/** Attach (or clear) one subsidy document by its fixed key. */
methods.setDocument = async (req, res) => {
  const { key, url } = req.body;
  const allowed = [
    'aadharCard', 'electricityBill', 'propertyProof',
    'bankPassbook', 'installationCertificate', 'inspectionReport',
  ];
  if (!allowed.includes(key)) {
    return res.status(400).json({
      success: false, result: null, message: `key must be one of: ${allowed.join(', ')}`,
    });
  }

  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { $set: { [`documents.${key}`]: url || null, updated: Date.now() } },
    { new: true }
  );
  if (!project) {
    return res.status(404).json({ success: false, result: null, message: 'Project not found.' });
  }

  return res.status(200).json({ success: true, result: project, message: 'Document updated' });
};

module.exports = methods;
