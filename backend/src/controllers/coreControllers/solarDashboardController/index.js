const mongoose = require('mongoose');

/**
 * One request that answers "how is the business doing right now".
 *
 * The dashboard used to need six round-trips; every widget here comes from a
 * single aggregation pass so the page paints once.
 */
const summary = async (req, res) => {
  const Lead = mongoose.model('Lead');
  const Project = mongoose.model('Project');
  const ServiceTicket = mongoose.model('ServiceTicket');
  const AmcContract = mongoose.model('AmcContract');

  const now = new Date();
  const stages = Lead.schema.path('status').enumValues;

  const [
    leadCount, pipelineRaw, activeProjects, projects,
    openTickets, overdueLeads, recentLeads, expiringAmc,
  ] = await Promise.all([
    Lead.countDocuments({ removed: false }),
    Lead.aggregate([
      { $match: { removed: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Project.countDocuments({ removed: false, status: 'In Progress' }),
    Project.find({ removed: false }).select('projectName paymentSchedule expectedSubsidy portalStatus subsidyAppliedDate state lead').populate('lead', 'name'),
    ServiceTicket.countDocuments({ removed: false, status: { $in: ['Open', 'In Progress'] } }),
    Lead.find({ removed: false, followUpDate: { $lt: now }, status: { $nin: ['Won', 'Lost'] } })
      .select('name followUpDate status').sort({ followUpDate: 1 }).limit(10),
    Lead.find({ removed: false }).select('name status created').sort({ created: -1 }).limit(5),
    AmcContract.countDocuments({
      removed: false,
      status: { $ne: 'Cancelled' },
      expiryDate: { $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  // Money: what's been collected vs what's still owed, across every project.
  let collections = 0;
  let outstanding = 0;
  projects.forEach((p) => {
    (p.paymentSchedule || []).forEach((s) => {
      collections += s.amountReceived || 0;
      outstanding += Math.max((s.amountDue || 0) - (s.amountReceived || 0), 0);
    });
  });

  // "Stuck" = applied to the portal but nothing back after the threshold. This
  // is the number that actually costs the customer money, so it gets its own
  // widget rather than hiding inside the subsidy list.
  const thresholdDays = Number(req.query.subsidyThresholdDays) || 45;
  const stuckSubsidies = projects
    .filter((p) => {
      if (!p.subsidyAppliedDate) return false;
      if (['Disbursed', 'Rejected'].includes(p.portalStatus)) return false;
      const days = (now - new Date(p.subsidyAppliedDate)) / (1000 * 60 * 60 * 24);
      return days > thresholdDays;
    })
    .map((p) => ({
      _id: p._id,
      projectName: p.projectName,
      portalStatus: p.portalStatus,
      daysElapsed: Math.floor((now - new Date(p.subsidyAppliedDate)) / (1000 * 60 * 60 * 24)),
    }));

  const pipeline = stages.map((stage) => ({
    stage,
    count: pipelineRaw.find((p) => p._id === stage)?.count || 0,
  }));

  return res.status(200).json({
    success: true,
    result: {
      cards: {
        leads: leadCount,
        activeProjects,
        collections: Math.round(collections),
        outstanding: Math.round(outstanding),
        openTickets,
        expiringAmc,
      },
      pipeline,
      overdueFollowUps: overdueLeads,
      stuckSubsidies,
      recentLeads,
    },
    message: 'Dashboard summary',
  });
};

module.exports = { summary };
