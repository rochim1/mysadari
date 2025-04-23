const UsersService = require('../services/userService');
const User = require('../models/userModel'); // Adjust the path to your models if needed
const Diagnose = require('../models/diagnoseModel'); // Adjust the path to your models if needed
const UserLogAccessModel = require('../models/userLogAccessModel'); // Adjust the path to your models if needed
const bcrypt = require('bcryptjs'); // For hashing passwords
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const {
  sendEmailFunction
} = require('../mail_templates/index');

const {
  validationResult
} = require('express-validator'); // For request validation
const {
  loginWithGoogle
} = require('../utils/userUtilities')
const jwt = require('jsonwebtoken');

const getOneDiagnose = async (req, res) => {
  try {
    const { id_diagnose } = req.params;

    if (!id_diagnose) {
      return res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        error: {
          message: "can't get id_diagnose"
        }
      });
    }

    const diagnose = await Diagnose.findOne({
      where: {
        id_diagnose,
        status: 'active'
      }
    });

    if (!diagnose) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: 'Diagnose not found'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: diagnose
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      error: {
        message: error.message
      }
    });
  }
};

const getAllDiagnoses = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.body;
    const { status, id_user } = req.body && req.body.filter ? req.body.filter : { status: 'active' };

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    let whereClause = {
      status,
      ...(id_user && { id_user }) // Add id_user to the filter if it exists
    };

    const diagnoses = await Diagnose.findAndCountAll({
      where: whereClause,
      offset,
      limit
    });

    return res.status(200).json({
      success: true,
      totalItems: diagnoses.count,
      totalPages: Math.ceil(diagnoses.count / pageSize),
      currentPage: parseInt(page),
      data: diagnoses.rows
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      error: {
        message: error.message
      }
    });
  }
};

// mutation
const createDiagnose = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        code: 'BAD_REQUEST',
        error: {
          message: errors.array()
        }
      });
    }

    // Extract user data from request
    let {
      diagnose,
      stage,
      siklus,
      period,
      diagnose_date,
      kemo_start_date,
      responsible_doctor,
      id_user,
    } = req.body;

    if (!id_user) {
      id_user = req.user.id_user;
    }
    
    // Create new user
    const createDiagnose = await Diagnose.create({
      diagnose,
      stage,
      siklus,
      period,
      diagnose_date,
      kemo_start_date,
      responsible_doctor,
      id_user,
    });

    // Respond with success
    res.status(201).json({
      success: true,
      message: 'Diagnose created successfully',
      data: createDiagnose
    });
  } catch (error) {
    // Handle errors
    console.error('Error creating diagnose:', error);
    res.status(500).json({
      success: false,
      message: 'INTERNAL_SERVER_ERROR',
      error: {
        message: error.message
      }
    });
  }
};

const updateDiagnose = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        code: 'BAD_REQUEST',
        error: {
          message: errors.array()
        }
      });
    }

    // Extract data from request
    const {
      diagnose,
      stage,
      siklus,
      period,
      diagnose_date,
      kemo_start_date,
      responsible_doctor,
      id_user,
    } = req.body;

    // Find diagnose by ID
    const diagnoseToUpdate = await Diagnose.findOne({
      where: {
        id_diagnose: req.params.id_diagnose,
        status: 'active'
      }
    });

    // If diagnose doesn't exist, return a 404 error
    if (!diagnoseToUpdate) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        error: {
          message: 'Diagnose not found'
        }
      });
    }

    // Update diagnose
    const updatedDiagnose = await diagnoseToUpdate.update({
      diagnose,
      stage,
      siklus,
      period,
      diagnose_date,
      kemo_start_date,
      responsible_doctor,
      id_user,
    });

    // Respond with success
    res.status(200).json({
      success: true,
      message: 'Diagnose updated successfully',
      data: updatedDiagnose
    });
  } catch (error) {
    // Handle errors
    console.error('Error updating diagnose:', error);
    res.status(500).json({
      success: false,
      message: 'INTERNAL_SERVER_ERROR',
      error: {
        message: error.message
      }
    });
  }
};

const deleteDiagnose = async (req, res) => {
  try {
    // Find diagnose by ID
    const diagnoseToDelete = await Diagnose.findOne({
      where: {
        id_diagnose: req.params.id_diagnose,
        status: 'active'
      }
    });

    // If diagnose doesn't exist, return a 404 error
    if (!diagnoseToDelete) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        error: {
          message: 'Diagnose not found'
        }
      });
    }

    // Perform soft delete (set status to 'deleted' and set deletedAt to current date)
    const deletedDiagnose = await diagnoseToDelete.update({
      status: 'deleted',
      deletedAt: new Date()
    });

    // Respond with success
    res.status(200).json({
      success: true,
      message: 'Diagnose deleted successfully',
      data: deletedDiagnose
    });
  } catch (error) {
    // Handle errors
    console.error('Error deleting diagnose:', error);
    res.status(500).json({
      success: false,
      message: 'INTERNAL_SERVER_ERROR',
      error: {
        message: error.message
      }
    });
  }
};

module.exports = {
  createDiagnose,
  updateDiagnose,
  deleteDiagnose,
  getAllDiagnoses,
  getOneDiagnose
}