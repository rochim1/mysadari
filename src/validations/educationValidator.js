const {
  body
} = require('express-validator');
const Educations = require('../models/educationModel'); // Import the Educations model
const uuidValidate = require('uuid-validate');

// Custom function to allow null
const allowNull = (validatorFn) => {
  return (value, {
    req
  }) => {
    if (value === null || value === '') {
      return true; // Allow `null` or empty string
    }
    return validatorFn(value, {
      req
    }); // Apply original validator
  };
};

const educationValidatorCreate = [
  body('title')
  .notEmpty().withMessage('Title is required')
  .isString().withMessage('Title must be a string')
  .isLength({
    max: 200
  }).withMessage('Title can be at most 200 characters long')
  .custom(async (value) => {
    // Check for uniqueness in the Educations table
    const education = await Educations.findOne({
      where: {
        title: value
      }
    });
    if (education) {
      throw new Error('Title must be unique');
    }
    return true;
  }),

  body('content')
  .optional()
  .isString().withMessage('Content must be a string'),

  body('video_link')
  .custom(allowNull((value) => {
    // Validate URL if not null
    return /^https?:\/\/[^\s$.?#].[^\s]*$/.test(value);
  }))
  .withMessage('Video link must be a valid URL')
  .isLength({
    max: 150
  })
  .withMessage('Video link can be at most 150 characters long'),
  body('id_side_effects')
  .optional()
  .isArray().withMessage('id_side_effects must be an array')
  .custom((value) => {
    if (value.length === 0) {
      return true
      // throw new Error('At least one id_side_effect is required');
    }
    if (!value.every(id => uuidValidate(id))) {
      throw new Error('Each id_side_effect must be a valid UUID');
    }
    return true;
  }),
  // Thumbnail is handled by multer, so no need to validate it here
  // Multer will manage file types and sizes.
];

const educationValidatorUpdate = [
  body('title')
  .notEmpty().withMessage('Title is required')
  .isString().withMessage('Title must be a string')
  .isLength({
    max: 200
  }).withMessage('Title can be at most 200 characters long'),

  body('content')
  .optional()
  .isString().withMessage('Content must be a string'),

  body('video_link')
  .custom(allowNull((value) => {
    // Validate URL if not null
    return /^https?:\/\/[^\s$.?#].[^\s]*$/.test(value);
  }))
  .withMessage('Video link must be a valid URL')
  .isLength({
    max: 150
  })
  .withMessage('Video link can be at most 150 characters long'),

  body('id_side_effects')
  .optional()
  .isArray().withMessage('id_side_effects must be an array')
  .custom((value) => {
    if (value.length === 0) {
      return true
      // throw new Error('At least one id_side_effect is required');
    }
    if (!value.every(id => uuidValidate(id))) {
      throw new Error('Each id_side_effect must be a valid UUID');
    }
    return true;
  }),
  // Thumbnail is handled by multer, so no need to validate it here
  // Multer will manage file types and sizes.
];

module.exports = {
  educationValidatorCreate,
  educationValidatorUpdate
}