const { body } = require('express-validator');

const monitoringLabValidator = [
  body('id_user')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('id_user must be a valid UUID'),
  
  body('date_lab')
    .isISO8601()
    .withMessage('date_lab must be a valid date'),

  body('body_weight')
    .optional({ nullable: true })  // Optional field
    .isFloat({ min: 0 })
    .withMessage('body_weight must be a positive float'),

  body('body_height')
    .optional({ nullable: true })  // Optional field
    .isFloat({ min: 0 })
    .withMessage('body_height must be a positive float'),

  body('hemoglobin')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('hemoglobin must be a positive float'),

  body('leucocytes')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('leucocytes must be a positive float'),

  body('platelets')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('platelets must be a positive float'),

  body('neutrophyle')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('neutrophyle must be a positive float'),

  body('sgot')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('sgot must be a positive float'),

  body('sgpt')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('sgpt must be a positive float'),

  body('bun')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('bun must be a positive float'),

  body('creatinine')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('creatinine must be a positive float'),

  body('glucose')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('glucose must be a positive float'),

  body('amylase')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('amylase must be a positive float'),

  body('Lipase')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Lipase must be a positive float'),

  body('note')
    .optional({ nullable: true })
    .isString()
    .withMessage('note must be a string'),

  body('status')
    .optional({ nullable: true })
    .isIn(['active', 'deleted'])
    .withMessage('status must be either active or deleted'),
];

module.exports = monitoringLabValidator;
