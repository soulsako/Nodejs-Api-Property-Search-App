const express = require('express');
const companyController = require('../controllers/companyController');
const router = express.Router();


router.
  route('/')
  .post(companyController.newCompany);


  module.exports = router;