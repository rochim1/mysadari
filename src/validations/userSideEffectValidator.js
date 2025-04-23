const { body, param } = require('express-validator');
const { UUIDv4 } = require('uuid');

// Validation rules for creating and updating User Side Effects
const validateUserSideEffects = [
  body('id_side_effect')
    .isUUID().withMessage('id_side_effect must be a valid UUID'),

  body('id_user')
    .optional()
    .isUUID().withMessage('id_user must be a valid UUID'),

  body('date_feel')
    .isISO8601().withMessage('date_feel must be a valid date format'),

  body('cycle_to')
    .notEmpty().withMessage('cycle to is required'),

  body('severity')
    .optional()
    .isInt({ min: 1, max: 4 }).withMessage('Severity must be an integer between 1 and 4'),

  body('frekuensi')
    .optional()
    .isInt({ min: 1, max: 4 }).withMessage('Frekuensi must be an integer between 1 and 4'),

  body('distress')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Distress must be an integer between 1 and 5'),

  body('note')
    .optional()
    .isString().withMessage('Note must be a string'),
];

module.exports = validateUserSideEffects
