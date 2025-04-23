const { body } = require('express-validator');
const { Op } = require("sequelize");
// const drugSchModel = require('../models/drugSchModel');

const validateDrugConsumeTime = [
  // Check that `id_drug_schedule` exists and is a valid UUID
  body('id_drug_schedule')
    .isUUID().withMessage('id_drug_schedule must be a valid UUID'),

  // Check that `name` is a string and optional
  body('name')
    .optional()
    .isString().withMessage('Name must be a string'), // get from drug name

  // Check that `time` is a string and valid format (Optional field)
  body('time')
    .optional()
    .isString().withMessage('Time must be a valid string'),

  // Check that `id_user` exists and is a valid UUID
  // body('id_user')
  //   .isUUID().withMessage('id_user must be a valid UUID'),

  // Validate `date` as a required field and a valid date format
  body('date')
    .notEmpty().withMessage('Date is required')
    .isDate({ format: 'YYYY-MM-DD' }).withMessage('Date must be a valid date in the format YYYY-MM-DD'),
];

module.exports = validateDrugConsumeTime;
