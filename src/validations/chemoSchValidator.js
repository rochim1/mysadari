const {
  body
} = require('express-validator');

const chemoSchValidator = [
  body('tujuan_kemoterapi')
  .notEmpty().withMessage('tujuan kemoterapi is required')
  .isString().withMessage('Tujuan kemoterapi must be a string')
  .isLength({
    max: 150
  }).withMessage('Tujuan kemoterapi can be at most 50 characters long'),

  body('tanggal_kemoterapi')
  .notEmpty().withMessage('tanggal kemoterapi is required')
  .isString().withMessage('Tanggal kemoterapi must be a string')
  .isLength({
    max: 50
  }).withMessage('Tanggal kemoterapi can be at most 50 characters long'),

  body('waktu_kemoterapi')
  .notEmpty().withMessage('waktu kemoterapi is required')
  .isString().withMessage('Waktu kemoterapi must be a string')
  .isLength({
    max: 50
  }).withMessage('Waktu kemoterapi can be at most 50 characters long'),

  body('remember_before_minutes')
  .optional()
  .isString().withMessage('Remember before minutes must be a string')
  .isLength({
    max: 50
  }).withMessage('Remember before minutes can be at most 50 characters long'),

  body('notes')
  .optional()
  .isString().withMessage('Notes must be a string'),

  body('status')
  .optional()
  .isIn(['active', 'deleted']).withMessage('Status must be either "active" or "deleted"'),
]
module.exports = chemoSchValidator;