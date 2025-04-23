const { body } = require('express-validator');

const createDiagnoseValidator = [
  body('diagnose').notEmpty().withMessage('diagnose is required').isString().isLength({ max: 50 }).withMessage('Diagnose should be a string with max length 50'),
  body('stage').optional().isString().isLength({ max: 20 }).withMessage('Stage should be a string with max length 20'),
  body('siklus').optional().isString().isLength({ max: 200 }).withMessage('Siklus should be a string with max length 200'),
  body('period').optional().isString().isLength({ max: 100 }).withMessage('Period should be a string with max length 100'),
  body('diagnose_date').optional().isDate().withMessage('Diagnose Date should be a valid date'),
  body('kemo_start_date').optional().isDate().withMessage('Kemo Start Date should be a valid date'),
  body('responsible_doctor').optional().isString().isLength({ max: 70 }).withMessage('Responsible doctor name should be max length 70'),
  body('id_user').notEmpty().withMessage('id_user is required').isUUID().withMessage('id_user must be a valid UUID'),
];

module.exports = createDiagnoseValidator;