const {
  validationResult
} = require("express-validator");
const {
  UserSideEffects,
  Recomendation,
  SideEffects
} = require("../models");
const moment = require('moment')

const createUserSideEffect = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        error: errors.array(),
      });
    }

    let {
      id_side_effect,
      id_user,
      date_feel,
      time_feel,
      cycle_to,
      severity,
      frekuensi,
      distress,
      note,
      status,
    } = req.body;

    if (!id_user) {
      id_user = req.user.id_user;
    }

    // todo, mybe in the future can add automatically cycle_to value
    const newUserSideEffect = await UserSideEffects.create({
      id_side_effect,
      id_user,
      date_feel,
      time_feel,
      cycle_to,
      severity,
      frekuensi,
      distress,
      note,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "User Side Effect created successfully",
      data: newUserSideEffect,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

const updateUserSideEffect = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        error: errors.array(),
      });
    }

    const {
      id_user_side_effect
    } = req.params;
    const {
      id_side_effect,
      id_user,
      date_feel,
      time_feel,
      cycle_to,
      severity,
      frekuensi,
      distress,
      note,
      status,
    } = req.body;

    if (!id_user) {
      id_user = req.user.id_user;
    }

    const userSideEffect = await UserSideEffects.findOne({
      where: {
        id_user_side_effect,
        status: "active",
      },
    });

    if (!userSideEffect) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "User Side Effect not found",
        },
      });
    }

    await userSideEffect.update({
      id_user_side_effect,
      id_user,
      date_feel,
      time_feel,
      cycle_to,
      severity,
      frekuensi,
      distress,
      note,
      status,
    });

    return res.status(200).json({
      success: true,
      message: "User Side Effect updated successfully",
      data: userSideEffect,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

const deleteUserSideEffect = async (req, res) => {
  try {
    const {
      id_user_side_effect
    } = req.params;

    // get user side effect first
    const userSideEffect = await UserSideEffects.findOne({
      where: {
        id_user_side_effect,
        status: "active",
      },
    });

    if (!userSideEffect) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "User Side Effect not found",
        },
      });
    }

    await userSideEffect.update({
      status: "deleted",
    });

    const deleteRecomendation = await Recomendation.update({
      id_side_effect: userSideEffect.id_side_effect,
      status: "active",
    });

    // delete also rekomendasi artikel

    return res.status(200).json({
      success: true,
      message: "User Side Effect soft-deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

const getOneUserSideEffect = async (req, res) => {
  try {
    const {
      id_user_side_effect
    } = req.params;

    const userSideEffect = await UserSideEffects.findOne({
      where: {
        id_user_side_effect,
        status: "active",
      },
    });

    if (!userSideEffect) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "User Side Effect not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: userSideEffect,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

const getAllUserSideEffects = async (req, res) => {
  try {
    const {
      page = 1, pageSize = 10
    } = req.body;
    const {
      status,
      id_user
    } =
    req.body && req.body.filter ?
      req.body.filter : {
        status: "active",
      };

    let whereClause = {
      status,
      ...(id_user && {
        id_user
      }), // Add id_user to the filter if it exists
    };

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    const {
      count,
      rows
    } = await UserSideEffects.findAndCountAll({
      where: whereClause,
      offset,
      limit,
      distinct: true, // Ensures distinct counting
      include: [{
        model: SideEffects, // Include SideEffects model
        as: "sideEffect", // Ensure the alias matches the relation in your models
        required: false, // If not required, we don't exclude UserSideEffects without side effects
      }, ],
    });

    if (rows && rows.length) {
      const userSideEffects = rows.map((userSideEffect) => {
        // Prepare the base user side effect data
        const userSideEffectData = {
          id_user_side_effect: userSideEffect.id_user_side_effect,
          id_side_effect: userSideEffect.id_side_effect,
          id_user: userSideEffect.id_user,
          date_feel: userSideEffect.date_feel,
          time_feel: userSideEffect.time_feel,
          cycle_to: userSideEffect.cycle_to,
          severity: userSideEffect.severity,
          frekuensi: userSideEffect.frekuensi,
          distress: userSideEffect.distress,
          note: userSideEffect.note,
          status: userSideEffect.status,
          deletedAt: userSideEffect.deletedAt,
          createdAt: userSideEffect.createdAt,
          updatedAt: userSideEffect.updatedAt,
        };

        // Return user side effect data along with associated side effects
        return {
          ...userSideEffectData,
          side_effects: userSideEffect.sideEffect,
        };
      });

      return res.status(200).json({
        success: true,
        totalItems: count,
        totalPages: Math.ceil(count / pageSize),
        currentPage: parseInt(page),
        data: userSideEffects,
      });
    } else {
      // If no records found, return empty response
      return res.status(200).json({
        success: true,
        totalItems: 0,
        totalPages: 0,
        currentPage: parseInt(page),
        data: [],
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

// Function to sort charts by date dynamically
function sortChartsByDate(data, order = 'asc') {
  const charts = data.charts;

  // Determine the sorting order
  const sortOrder = order === 'asc' ? 1 : -1;

  // Sorting each array dynamically
  ['severity', 'frekuensi', 'distress'].forEach(key => {
    charts[key] = charts[key].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder * (dateA - dateB);
    });
  });

  if (charts.severity.length == 1) {
    delete data.charts
  }
  return data;
}

const getAllUserSideEffectsGroup = async (req, res) => {
  try {
    const {
      status = "active", id_user
    } = req.body.filter || {};

    // Fetch raw data from database
    const {
      count,
      rows: rawData
    } = await UserSideEffects.findAndCountAll({
      where: {
        status,
        ...(id_user && {
          id_user
        }),
      },
      include: [{
        model: SideEffects, // Adjust the model name to match your Sequelize relation
        as: "sideEffect", // Ensure the alias matches the model relation
        required: false, // Include records without side effects
      }, ],
      order: [
        ['cycle_to', 'DESC']
      ], // Dynamic ordering
    });

    // Group data by id_side_effect and cycle_to
    const groupedData = rawData.reduce((acc, item) => {
      const groupKey = `${item.id_side_effect}_${item.cycle_to}`;

      if (!acc[groupKey]) {
        acc[groupKey] = {
          ...item.toJSON(), // Convert Sequelize instance to plain object
          side_effects: item.sideEffect,
          charts: {
            severity: [{
              id_user_side_effect: item.id_user_side_effect,
              id_side_effect: item.id_side_effect,
              val: item.severity,
              date: moment(`${item.date_feel}T${item.time_feel}`, moment.ISO_8601, true)
            }],
            frekuensi: [{
              id_user_side_effect: item.id_user_side_effect,
              id_side_effect: item.id_side_effect,
              val: item.frekuensi,
              date: moment(`${item.date_feel}T${item.time_feel}`, moment.ISO_8601, true)
            }],
            distress: [{
              id_user_side_effect: item.id_user_side_effect,
              id_side_effect: item.id_side_effect,
              val: item.distress,
              date: moment(`${item.date_feel}T${item.time_feel}`, moment.ISO_8601, true)
            }]
          }, // Initialize charts as an empty array
        };

        delete acc[groupKey].sideEffect
      } else {
        acc[groupKey].charts.severity.push({
          id_user_side_effect: item.id_user_side_effect,
          id_side_effect: item.id_side_effect,
          val: item.severity,
          date: moment(`${item.date_feel}T${item.time_feel}`, moment.ISO_8601, true)
        });

        acc[groupKey].charts.frekuensi.push({
          id_user_side_effect: item.id_user_side_effect,
          id_side_effect: item.id_side_effect,
          val: item.frekuensi,
          date: moment(`${item.date_feel}T${item.time_feel}`, moment.ISO_8601, true)
        });

        acc[groupKey].charts.distress.push({
          id_user_side_effect: item.id_user_side_effect,
          id_side_effect: item.id_side_effect,
          val: item.distress,
          date: moment(`${item.date_feel}T${item.time_feel}`, moment.ISO_8601, true)
        });

      }


      // acc[groupKey].charts.push(item.toJSON());
      return acc;
    }, {});

    // Convert grouped data object back to array
    const groupedArray = Object.values(groupedData).map(data => sortChartsByDate(data))

    // Respond with grouped data
    return res.status(200).json({
      success: true,
      totalItems: count,
      data: groupedArray,
    });
  } catch (error) {
    console.error("Error in getAllUserSideEffectsGroup:", error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

const sequelize = require('../config/database');
const getAllUserSideEffectsGroupBySQL = async (req, res) => {
  try {
    // const { status = "active", id_user, order = 'DESC', page = 1, pageSize = 10 } = req.body || {};
    const {
      page = 1, pageSize = 10, order = 'DESC'
    } = req.body;
    let {
      status,
      id_user
    } =
    req.body && req.body.filter ?
      req.body.filter : {
        status: "active",
      };

    if (!id_user) {
      id_user = req.user.id_user;
    }

    const limit = parseInt(pageSize, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    // Fetch grouped and aggregated data from the database with pagination
    const rawData = await sequelize.query(`
      SELECT 
        u.id_side_effect,
        u.cycle_to,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id_user_side_effect', u.id_user_side_effect,
            'id_side_effect', u.id_side_effect,
            'val', u.severity,
            'date_feel', u.date_feel,
            'time_feel', u.time_feel,
            'date', CONCAT(u.date_feel, 'T', u.time_feel)
          ) ORDER BY u.date_feel DESC
        ) AS severity_data,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id_user_side_effect', u.id_user_side_effect,
            'id_side_effect', u.id_side_effect,
            'val', u.frekuensi,
            'date_feel', u.date_feel,
            'time_feel', u.time_feel,
            'date', CONCAT(u.date_feel, 'T', u.time_feel)
          ) ORDER BY u.date_feel DESC
        ) AS frekuensi_data,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id_user_side_effect', u.id_user_side_effect,
            'id_side_effect', u.id_side_effect,
            'val', u.distress,
            'date_feel', u.date_feel,
            'time_feel', u.time_feel,
            'date', CONCAT(u.date_feel, 'T', u.time_feel)
          ) ORDER BY u.date_feel DESC
        ) AS distress_data,
        JSON_OBJECT( 
          'id_side_effect', s.id_side_effect,  
          'effect_name', s.effect_name,  
          'effect_detail', s.effect_detail,  
          'status', s.status,  
          'deletedAt', s.deletedAt        
        ) AS side_effects
      FROM user_side_effects u
      LEFT JOIN side_effects s ON u.id_side_effect = s.id_side_effect
      WHERE u.status = :status
        AND (u.id_user = :id_user)
      GROUP BY u.id_side_effect, u.cycle_to
      ORDER BY u.cycle_to ${order.toUpperCase()}
      LIMIT :limit OFFSET :offset
    `, {
      replacements: {
        status,
        id_user,
        limit,
        offset
      },
      type: sequelize.QueryTypes.SELECT
    });


    // Fetch total item count for pagination
    const countResult = await sequelize.query(`
      SELECT COUNT(DISTINCT CONCAT(id_side_effect, '_', cycle_to)) AS total_count
      FROM user_side_effects
      WHERE status = :status
        AND (:id_user IS NULL OR id_user = :id_user)
    `, {
      replacements: {
        status,
        id_user
      },
      type: sequelize.QueryTypes.SELECT
    });

    const totalItems = countResult[0].total_count;
    const totalPages = Math.ceil(totalItems / limit);

    // Parse the aggregated data back into arrays
    const groupedArray = rawData.map(item => {
      return {
        id_side_effect: item.id_side_effect,
        cycle_to: item.cycle_to,
        side_effects: JSON.parse(`[${item.side_effects}]`)[0],
        charts: {
          severity: JSON.parse(`[${item.severity_data}]`), // Convert to an array
          frekuensi: JSON.parse(`[${item.frekuensi_data}]`),
          distress: JSON.parse(`[${item.distress_data}]`)
        }
      };
    });

    // Return paginated data
    return res.status(200).json({
      success: true,
      totalItems,
      totalPages,
      data: groupedArray,
    });
  } catch (error) {
    console.error("Error in getAllUserSideEffectsGroup:", error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};




module.exports = {
  createUserSideEffect,
  updateUserSideEffect,
  deleteUserSideEffect,
  getOneUserSideEffect,
  getAllUserSideEffects,
  getAllUserSideEffectsGroup,
  getAllUserSideEffectsGroupBySQL
};