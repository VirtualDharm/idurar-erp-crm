const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const methods = createCRUDController('ServiceTicket');
const ServiceTicket = mongoose.model('ServiceTicket');

const nextTicketNumber = async () => {
  const year = new Date().getFullYear();
  const last = await ServiceTicket.findOne({ ticketNumber: new RegExp(`^TCK-${year}-`) })
    .sort({ ticketNumber: -1 })
    .select('ticketNumber');
  const seq = last ? parseInt(last.ticketNumber.split('-')[2], 10) + 1 : 1;
  return `TCK-${year}-${String(seq).padStart(4, '0')}`;
};

methods.create = async (req, res) => {
  const result = await new ServiceTicket({
    ...req.body,
    ticketNumber: await nextTicketNumber(),
  }).save();

  return res.status(200).json({ success: true, result, message: 'Ticket created' });
};

/** Closing a ticket stamps the resolution time, so first-response/resolution
 *  metrics stay possible later without backfilling. */
methods.update = async (req, res) => {
  const body = { ...req.body, updated: Date.now() };
  if (['Resolved', 'Closed'].includes(body.status) && !body.resolvedOn) {
    body.resolvedOn = new Date();
  }

  const result = await ServiceTicket.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { $set: body },
    { new: true, runValidators: true }
  );
  if (!result) {
    return res.status(404).json({ success: false, result: null, message: 'Ticket not found.' });
  }

  return res.status(200).json({ success: true, result, message: 'Ticket updated' });
};

module.exports = methods;
