const { validationResult } = require("express-validator");
const MonitoringLabModel = require("../models/monitoringLabModel");

const createMonitorLab = async (req, res) => {
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
      id_user,
      date_lab,
      body_weight,
      body_height,
      hemoglobin,
      leucocytes,
      platelets,
      neutrophyle,
      sgot,
      sgpt,
      bun,
      creatinine,
      glucose,
      amylase,
      Lipase,
      note,
    } = req.body;

    if (!id_user) {
      id_user = req.user.id_user;
    }

    // todo, mybe in the future can add automatically cycle_to value
    const newMonitoringLab = await MonitoringLabModel.create({
      id_user,
      date_lab,
      body_weight: body_weight || null,
      body_height: body_height || null,
      hemoglobin: hemoglobin || null,
      leucocytes: leucocytes || null,
      platelets: platelets || null,
      neutrophyle: neutrophyle || null,
      sgot: sgot || null,
      sgpt: sgpt || null,
      bun: bun || null,
      creatinine: creatinine || null,
      glucose: glucose || null,
      amylase: amylase || null,
      Lipase: Lipase || null,
      note: note || null,
    });

    return res.status(201).json({
      success: true,
      message: "monitoring lab created successfully",
      data: newMonitoringLab,
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

const updateMonitorLab = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        error: errors.array(),
      });
    }

    const { id_monitoring_lab } = req.params;
    let {
      id_user,
      date_lab,
      body_weight,
      body_height,
      hemoglobin,
      leucocytes,
      platelets,
      neutrophyle,
      sgot,
      sgpt,
      bun,
      creatinine,
      glucose,
      amylase,
      Lipase,
      note,
    } = req.body;

    if (!id_user) {
      id_user = req.user.id_user;
    }

    let monitoringLab = await MonitoringLabModel.findOne({
      where: {
        id_monitoring_lab,
        status: "active",
      },
    });

    if (!monitoringLab) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "monitoring lab not found",
        },
      });
    }

    monitoringLab = await monitoringLab.update({
      id_user,
      date_lab,
      body_weight,
      body_height,
      hemoglobin,
      leucocytes,
      platelets,
      neutrophyle,
      sgot,
      sgpt,
      bun,
      creatinine,
      glucose,
      amylase,
      Lipase,
      note,
    });

    return res.status(200).json({
      success: true,
      message: "monitoring lab updated successfully",
      data: monitoringLab,
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

const deleteMonitorLab = async (req, res) => {
  try {
    const { id_monitoring_lab } = req.params;

    // get user side effect first
    const MonitorLab = await MonitoringLabModel.findOne({
      where: {
        id_monitoring_lab,
        status: "active",
      },
    });

    if (!MonitorLab) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "monitor lab not found",
        },
      });
    }

    await MonitorLab.update({
      status: "deleted",
      deletedAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: "monitor lab deleted successfully",
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

const getOneMonitorLab = async (req, res) => {
  try {
    const { id_monitoring_lab } = req.params;

    const monitorLab = await MonitoringLabModel.findOne({
      where: {
        id_monitoring_lab,
        status: "active",
      },
    });

    if (!monitorLab) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "monitoring lab not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: monitorLab,
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

const getAllMonitoringLab = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.body;
    const { status, id_user } =
      req.body && req.body.filter
        ? req.body.filter
        : {
            status: "active",
          };

    let whereClause = {
      status,
      ...(id_user && { id_user }), // Add id_user to the filter if it exists
    };

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    const { count, rows } = await MonitoringLabModel.findAndCountAll({
      where: whereClause,
      offset,
      limit,
      order: [['createdAt', 'DESC']], // Or 'ASC' for ascending order
    });

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: parseInt(page),
      data: rows,
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

const getAllMonitoringLabChart = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.body;
    const { status, id_user } =
      req.body && req.body.filter
        ? req.body.filter
        : {
            status: "active",
          };

    let whereClause = {
      status,
      ...(id_user && { id_user }), // Add id_user to the filter if it exists
    };

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    const { count, rows } = await MonitoringLabModel.findAndCountAll({
      where: whereClause,
      offset,
      limit,
      order: [['createdAt', 'ASC']], // Or 'ASC' for ascending order
    });

    let data = {
      'id_monitoring_lab': rows && rows.length && rows[0].id_monitoring_lab ? rows[0].id_monitoring_lab : null,
      'id_user': rows && rows.length && rows[0].id_user ? rows[0].id_user : null,
      'chart': {
        'body_weight': [],
        'body_height': [],
        'hemoglobin': [],
        'leucocytes': [],
        'platelets': [],
        'neutrophyle': [],
        'sgot': [],
        'sgpt': [],
        'bun': [],
        'creatinine': [],
        'glucose': [],
        'amylase': [],
        'Lipase': [],
      }
    }

    rows.map(monitoring => {
        if (monitoring.body_weight) {
          data.chart.body_weight.push({
            val: monitoring.body_weight,
            date: monitoring.date_lab
          });
        }
        if (monitoring.body_height) {
          data.chart.body_height.push({
            val: monitoring.body_height,
            date: monitoring.date_lab
          });
        }
        if (monitoring.hemoglobin) {
          data.chart.hemoglobin.push({
            val: monitoring.hemoglobin,
            date: monitoring.date_lab
          });
        }
        if (monitoring.leucocytes) {
          data.chart.leucocytes.push({
            val: monitoring.leucocytes,
            date: monitoring.date_lab
          });
        }
        if (monitoring.platelets) {
          data.chart.platelets.push({
            val: monitoring.platelets,
            date: monitoring.date_lab
          });
        }
        if (monitoring.neutrophyle) {
          data.chart.neutrophyle.push({
            val: monitoring.neutrophyle,
            date: monitoring.date_lab
          });
        }
        if (monitoring.sgot) {
          data.chart.sgot.push({
            val: monitoring.sgot,
            date: monitoring.date_lab
          });
        }
        if (monitoring.sgpt) {
          data.chart.sgpt.push({
            val: monitoring.sgpt,
            date: monitoring.date_lab
          });
        }
        if (monitoring.bun) {
          data.chart.bun.push({
            val: monitoring.bun,
            date: monitoring.date_lab
          });
        }
        if (monitoring.creatinine) {
          data.chart.creatinine.push({
            val: monitoring.creatinine,
            date: monitoring.date_lab
          });
        }
        if (monitoring.glucose) {
          data.chart.glucose.push({
            val: monitoring.glucose,
            date: monitoring.date_lab
          });
        }
        if (monitoring.amylase) {
          data.chart.amylase.push({
            val: monitoring.amylase,
            date: monitoring.date_lab
          });
        }
        if (monitoring.Lipase) {
          data.chart.Lipase.push({
            val: monitoring.Lipase,
            date: monitoring.date_lab
          });
        }

    })
    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: parseInt(page),
      data: data,
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

module.exports = {
  getOneMonitorLab,
  getAllMonitoringLab,
  createMonitorLab,
  updateMonitorLab,
  deleteMonitorLab,
  getAllMonitoringLabChart
};
