const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Quotation');

methods.create = require('./create');
methods.update = require('./update');
methods.convert = require('./convertToProject');

module.exports = methods;
