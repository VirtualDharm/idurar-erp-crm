const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const methods = createCRUDController('AmcContract');
const AmcContract = mongoose.model('AmcContract');

const nextContractNumber = async () => {
  const year = new Date().getFullYear();
  const last = await AmcContract.findOne({ contractNumber: new RegExp(`^AMC-${year}-`) })
    .sort({ contractNumber: -1 })
    .select('contractNumber');
  const seq = last ? parseInt(last.contractNumber.split('-')[2], 10) + 1 : 1;
  return `AMC-${year}-${String(seq).padStart(4, '0')}`;
};

methods.create = async (req, res) => {
  const result = await new AmcContract({
    ...req.body,
    contractNumber: await nextContractNumber(),
  }).save();

  return res.status(200).json({ success: true, result, message: 'AMC contract created' });
};

module.exports = methods;
