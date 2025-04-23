const {
  validationResult
} = require('express-validator');
const {
  DrugSchedule,
  DrugConsumeTime
} = require('../models/index');
const moment = require('moment');
const momentz = require('moment-timezone');
const {
  Op
} = require('sequelize'); // Import Sequelize operators
const cronController = require('./cronController');

// not used now
// CREATE DrugConsumeTime
const createDrugConsumeTime = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      code: "BAD_REQUEST",
      error: errors.array(),
    });
  }

  try {
    let {
      id_drug_schedule,
      name,
      time,
      id_user,
      date
    } = req.body;
    if (!id_user) {
      id_user = req.user.id_user;
    }

    const drugSchedule = await DrugSchedule.findOne({
      where: {
        id_drug_schedule,
        status: "active",
      },
    });

    if (!drugSchedule) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: 'Drug schedule not found',
      });
    }

    name = name || drugSchedule.name;
    const newDrugConsumeTime = await DrugConsumeTime.create({
      id_drug_schedule,
      name,
      time,
      id_user,
      date
    });

    const drugConsumeTime = momentz(`${date} ${time}`, 'YYYY-MM-DD HH:mm').startOf('minute');
    const currentTime = moment().startOf('minute'); // Ignore seconds and milliseconds for comparison

    if (drugConsumeTime.isSameOrAfter(currentTime)) {
      cronController.scheduleNotification(newDrugConsumeTime, 'drug_consume_time');
    }


    return res.status(201).json({
      success: true,
      message: 'Drug consume time created successfully',
      data: newDrugConsumeTime
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: error.message,
    });
  }
};

const getAllDrugConsumeTimes = async (req, res) => {
  try {
    // Extract query parameters for pagination
    const {
      page,
      pageSize
    } = req.body;

    // Extract filter parameters from the request body
    const {
      id_user,
      id_drug_schedule,
      date,
      is_consumed,
      status,
      dateType,
    } = req.body.filter || {};

    // Initialize where clause
    let whereClause = {
      ...(id_user && {
        id_user
      }),
      ...(id_drug_schedule && {
        id_drug_schedule
      }),
      ...(is_consumed !== undefined && {
        is_consumed
      }),
      ...(status && {
        status
      }),
    };

    // Handle date filtering with Moment.js
    if (date) {
      if (dateType === 'bulanan') {
        // Filter for the specified month
        const startOfMonth = moment(date, 'YYYY-MM').startOf('month').format('YYYY-MM-DD');
        const endOfMonth = moment(date, 'YYYY-MM').endOf('month').format('YYYY-MM-DD');

        whereClause = {
          ...whereClause,
          date: {
            [Op.gte]: startOfMonth,
            [Op.lte]: endOfMonth,
          },
        };
      } else {
        // Filter for the exact date
        whereClause = {
          ...whereClause,
          date: {
            [Op.eq]: moment(date).format('YYYY-MM-DD'),
          },
        };
      }
    }

    // Handle pagination logic: get all data if page or pageSize is not provided
    const offset = page && pageSize ? (parseInt(page) - 1) * parseInt(pageSize) : null;
    const limit = pageSize ? parseInt(pageSize) : null;

    // Query the database
    const {
      count,
      rows
    } = await DrugConsumeTime.findAndCountAll({
      where: whereClause,
      offset: offset !== null ? offset : undefined, // Only include if pagination is applied
      limit: limit !== null ? limit : undefined, // Only include if pagination is applied
      include: [{
        model: DrugSchedule,
        as: 'drug_schedule', // Optional alias
        required: true, // Inner join, set to false for outer join
      }, ],
      order: [
        ['createdAt', 'DESC']
      ],
    });

    // Calculate totalPages only if pagination is applied
    const totalPages = pageSize ? Math.ceil(count / pageSize) : 1;

    // Send the response with pagination details
    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages,
      currentPage: page ? parseInt(page) : null, // Include currentPage only if pagination is applied
      data: rows,
    });
  } catch (error) {
    // Handle errors and send a response
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      error: error.message,
    });
  }
};



// GET DrugConsumeTime by ID
const GetOneDrugConsumeTime = async (req, res) => {
  try {
    const {
      id_drug_consume_time
    } = req.params;
    let drugConsumeTime = await DrugConsumeTime.findOne({
      where: {
        id_drug_consume_time,
        status: "active",
      },
      include: [{
        model: DrugSchedule,
        as: 'drug_schedule', // Optional alias
        required: true, // Inner join, set to false for outer join
        where: {
          status: 'active'
        }
      }, ],
    });

    if (!drugConsumeTime) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: 'Drug Consume Time not found',
      });
    }

    if (!drugConsumeTime) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: 'Drug consume time not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: drugConsumeTime
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: error.message,
    });
  }
};

// UPDATE DrugConsumeTime by ID
const updateDrugConsumeTime = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      code: "BAD_REQUEST",
      error: errors.array(),
    });
  }

  try {
    const {
      id_drug_consume_time
    } = req.params;
    const updatedData = req.body;

    let drugConsumeTime = await DrugConsumeTime.findOne({
      where: {
        id_drug_consume_time,
        status: "active",
      }
    });

    if (!drugConsumeTime) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: 'Drug Consume Time not found',
      });
    }

    await drugConsumeTime.update(updatedData);

    drugConsumeTime = await DrugConsumeTime.findOne({
      where: {
        id_drug_consume_time,
        status: "active",
      }
    });

    consumeTime = momentz(`${drugConsumeTime.date} ${drugConsumeTime.time}`, 'YYYY-MM-DD HH:mm').startOf('minute');
    const currentTime = moment().startOf('minute'); // Ignore seconds and milliseconds for comparison

    if (consumeTime.isSameOrAfter(currentTime)) {
      cronController.scheduleNotification(drugConsumeTime, 'drug_consume_time');
    }

    return res.status(200).json({
      success: true,
      message: 'Drug consume time updated successfully',
      data: drugConsumeTime
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: error.message,
    });
  }
};

// DELETE DrugConsumeTime by ID (Soft delete)
const deleteDrugConsumeTime = async (req, res) => {
  try {
    const {
      id_drug_consume_time
    } = req.params;
    let drugConsumeTime = await DrugConsumeTime.findOne({
      where: {
        id_drug_consume_time,
        status: "active",
      }
    });

    if (!drugConsumeTime) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: 'Drug consume time not found'
      });
    }

    await DrugConsumeTime.update({
      status: 'deleted',
      deletedAt: new Date()
    });

    cronController.stopScheduledJob(id_drug_consume_time, 'drug_consume_time');

    return res.status(200).json({
      success: true,
      message: 'Drug consume time deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: error.message,
    });
  }
};

module.exports = {
  createDrugConsumeTime,
  getAllDrugConsumeTimes,
  GetOneDrugConsumeTime,
  updateDrugConsumeTime,
  deleteDrugConsumeTime,
};