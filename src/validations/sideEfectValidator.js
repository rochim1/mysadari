const { body } = require('express-validator');

const validateSideEffect = [
  body('effect_name')
    .notEmpty()
    .withMessage('Effect name is required.')
    .isLength({ max: 200 })
    .withMessage('Effect name can be at most 200 characters long.'),
];

module.exports = validateSideEffect