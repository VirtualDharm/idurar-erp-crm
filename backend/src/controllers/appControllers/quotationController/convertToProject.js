const mongoose = require('mongoose');

const Quotation = mongoose.model('Quotation');
const Project = mongoose.model('Project');
const Lead = mongoose.model('Lead');
const { DEFAULT_MILESTONES } = require('@/models/appModels/Project');

/**
 * Turn an accepted quotation into a live installation project.
 *
 * This is the hand-off between sales and operations, so it does three things
 * atomically-ish: seeds the 10 installation milestones, converts the quote's
 * payment percentages into dated money milestones, and marks the lead Won.
 *
 * Idempotent: a quote already converted returns its existing project instead of
 * creating a duplicate, because the "Convert" button is easy to double-click.
 */
const convertToProject = async (req, res) => {
  const quotation = await Quotation.findOne({ _id: req.params.id, removed: false }).populate('lead');
  if (!quotation) {
    return res.status(404).json({ success: false, result: null, message: 'Quotation not found.' });
  }

  const already = await Project.findOne({ quotation: quotation._id, removed: false });
  if (already) {
    return res.status(200).json({
      success: true,
      result: already,
      message: 'This quotation is already converted.',
    });
  }

  const lead = quotation.lead;
  const total = quotation.grandTotal || 0;

  // Percentages → amounts. Due dates start at commissioning-ish horizons; the
  // ops team edits them, but a schedule with no dates never gets chased.
  const pct = [
    { milestone: 'Advance Payment', percent: quotation.advancePercent, days: 0 },
    { milestone: 'Delivery Payment', percent: quotation.deliveryPercent, days: 15 },
    { milestone: 'Commissioning Payment', percent: quotation.commissioningPercent, days: 30 },
  ];

  const paymentSchedule = pct
    .filter((p) => p.percent > 0)
    .map((p) => ({
      milestone: p.milestone,
      amountDue: Math.round((total * p.percent) / 100),
      dueDate: new Date(Date.now() + p.days * 24 * 60 * 60 * 1000),
      status: 'Pending',
      amountReceived: 0,
    }));

  const project = await new Project({
    projectName: `${lead.name} - ${quotation.systemSizeKw}kW - ${new Date().getFullYear()}`,
    lead: lead._id,
    quotation: quotation._id,
    systemSizeKw: quotation.systemSizeKw,
    location: [lead.city, lead.state].filter(Boolean).join(', '),
    state: lead.state,
    projectValue: total,
    status: 'In Progress',
    milestones: DEFAULT_MILESTONES.map((title) => ({ title, done: false })),
    paymentSchedule,
    expectedSubsidy: (quotation.centralSubsidy || 0) + (quotation.stateSubsidy || 0),
  }).save();

  quotation.status = 'Accepted';
  await quotation.save();

  if (lead.status !== 'Won') {
    await Lead.updateOne({ _id: lead._id }, { $set: { status: 'Won', updated: Date.now() } });
  }

  return res.status(200).json({
    success: true,
    result: project,
    message: 'Quotation converted to project',
  });
};

module.exports = convertToProject;
