const { body, validationResult } = require('express-validator');
const drugScheduleController = require('../controllers/drugSchController');


// Validation rules for DrugSchedule
const drugScheduleValidationRules = [
  body('drug_name')
    .isString().withMessage('Drug name must be a string')
    .isLength({ max: 100 }).withMessage('Drug name cannot exceed 100 characters')
    .notEmpty().withMessage('Drug name is required'),

  body('dose')
    .isInt({ min: 1, max: 99 }).withMessage('Dose must be a number between 1 and 99')
    .notEmpty().withMessage('Dose is required'),

  body('drug_unit')
    .isIn([
      'Pil', 'Tablet', 'Tetes', 'Kaplet', 'Kapsul', 'Semprotan (spray)', 
      'Supositoria', 'Sirup', 'Salep', 'Krim', 'Gel', 'Serbuk', 'Injeksi (suntikan)',
      'Infus', 'Inhaler', 'Patch (plester)', 'Larutan', 'Suspensi', 'Emulsi', 'Granul',
      'Obat kumur'
    ]).withMessage('Invalid drug unit')
    .notEmpty().withMessage('Drug unit is required'),

  body('periode')
    .isIn(['setiap_hari', 'hari_pilihan']).withMessage('Invalid periode')
    .notEmpty().withMessage('Periode is required'),

  body('consume_regulation')
    .isIn(['sebelum_makan', 'sesudah_makan', 'saat_makan', 'saat_perut_kosong', 'sebelum tidur', 'setelah_bangun_tidur']).withMessage('Invalid consume regulation')
    .notEmpty().withMessage('Consume regulation is required'),

  // bila tidak di isi akan di asumsikan selama 1 bulan
  // body('consume_time')
  //   .notEmpty().withMessage('consume_time is required'),

  // body('first_date_consume')
  //   .notEmpty().withMessage('first date consume is required'),
  
  // body('long_consume')
  //   .notEmpty().withMessage('long consume is required'),

  body('activate_notive')
    .isBoolean().withMessage('Activate notice must be a boolean')
    .notEmpty().withMessage('Activate notice is required'),
];

module.exports = drugScheduleValidationRules;