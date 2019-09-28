const Company =  require('../models/companyModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./../controllers/handlerFactory');

exports.newCompany = factory.createDoc(Company);