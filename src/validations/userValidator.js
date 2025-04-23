const {
  check,
  validationResult
} = require('express-validator');
const User = require('../models/userModel');
// Validation rules for the fields
const validateUser = [
  // require
  check('email')
  .isEmail().withMessage('Please enter a valid email address')
  // .notEmpty().withMessage('Email is required')
  .optional()
  .custom(async (value) => {
    // Check if the email already exists in the database
    const user = await User.findOne({
      where: {
        email: value,
        // status: 'active'
      }
    });
    if (user) {
      throw new Error('Email already in use');
    }
    return true;
  }),
  check('password').isLength({
    min: 6
  }).withMessage('Password must be at least 6 characters long'),
  check('username').optional().custom(async (value) => {
    // Check if the email already exists in the database
    if (!value) {
      return true;
    }
    
    const user = await User.findOne({
      where: {
        username: value,
        // status: 'active'
      }
    });
    if (user) {
      throw new Error('Username already in use');
    }
    return true;
  }),

  // not require (.optional())
  // check('name').notEmpty().withMessage('Name is required'),
  check('birthdate').optional().isDate().withMessage('Invalid birthdate'),
  // check('address').notEmpty().withMessage('Address is required'),
  check('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  check('gender').optional().isIn(['m', 'f']).withMessage('Invalid gender'),
  check('marriage_status').optional().isBoolean().withMessage('Marriage status must be a boolean value'),
  // check('last_education').notEmpty().withMessage('Last education is required'),
  // check('stay_with').notEmpty().withMessage('Stay with is required'),
  // check('job').notEmpty().withMessage('Job is required')
];

module.exports = validateUser;