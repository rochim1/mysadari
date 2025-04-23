const { validationResult } = require("express-validator");
const SideEffect = require("../models/sideEffectsModel");

// Create Side Effect
const createSideEffect = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        error: errors.array(),
      });
    }

    const { effect_name, effect_detail } = req.body;

    const newSideEffect = await SideEffect.create({
      effect_name,
      effect_detail,
    });

    return res.status(201).json({
      success: true,
      message: "Side effect created successfully",
      data: newSideEffect,
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

// Get One Side Effect
const getOneSideEffect = async (req, res) => {
  try {
    const { id_side_effect } = req.params;

    const sideEffect = await SideEffect.findOne({
      where: {
        id_side_effect,
        status: "active",
      },
    });

    if (!sideEffect) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "Side effect not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: sideEffect,
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

// Get All Side Effects with Pagination
const getAllSideEffects = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.body;
    const { status } = req.body.filter || {
      status: "active",
    };

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    const sideEffects = await SideEffect.findAndCountAll({
      where: {
        status,
      },
      offset,
      limit,
    });

    return res.status(200).json({
      success: true,
      totalItems: sideEffects.count,
      totalPages: Math.ceil(sideEffects.count / pageSize),
      currentPage: parseInt(page),
      sideEffects: sideEffects.rows,
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

// Update Side Effect
const updateSideEffect = async (req, res) => {
  try {
    const { id_side_effect } = req.params;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        error: errors.array(),
      });
    }

    const sideEffect = await SideEffect.findOne({
      where: {
        id_side_effect,
        status: "active",
      },
    });

    if (!sideEffect) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "Side effect not found",
        },
      });
    }

    const updatedSideEffect = await sideEffect.update(req.body);

    return res.status(200).json({
      success: true,
      message: "Side effect updated successfully",
      data: updatedSideEffect,
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

// Soft Delete Side Effect
const deleteSideEffect = async (req, res) => {
  try {
    const { id_side_effect } = req.params;

    const sideEffect = await SideEffect.findOne({
      where: {
        id_side_effect,
        status: "active",
      },
    });

    if (!sideEffect) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "Side effect not found",
        },
      });
    }

    await sideEffect.update({
      status: "deleted",
      deletedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Side effect soft-deleted successfully",
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
  createSideEffect,
  getOneSideEffect,
  getAllSideEffects,
  updateSideEffect,
  deleteSideEffect,
};
