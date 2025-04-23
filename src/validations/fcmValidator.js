const {
  check,
  validationResult
} = require('express-validator');

// Validation rules for the fields
const validateFcm = [
  // require
  check('fcm_token').notEmpty().withMessage('FCM Token is required')
];

module.exports = validateFcm;