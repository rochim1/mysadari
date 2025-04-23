const { Educations, Recomendation, SideEffects } = require("../models");
const UserSideEffects = require("../models/userSideEffectsModel");
const { Op } = require("sequelize");

const getRecomendation = async (req, res) => {
  try {
    // Handle pagination
    const { page = 1, pageSize = 10 } = req.body;
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    // Destructure filter object, with default values
    let { status = "active", id_user, tipe } = req.body?.filter || {};

    // Create where clauses
    let whereClause = { status };
    let EducationWhereClause = {};

    // Handle filtering based on type (tipe)
    if (tipe) {
      if (tipe === "video_only") {
        EducationWhereClause.video_link = { [Op.ne]: null };
      } else if (tipe === "article_only") {
        EducationWhereClause.video_link = { [Op.eq]: null };
      }
    }

    // Use req.user.id_user if id_user is not provided
    if (!id_user) {
      id_user = req.user.id_user;
    }

    // Fetch user side effects
    const userSideEffects = await UserSideEffects.findAll({
      where: {
        id_user,
        status: "active",
      },
      attributes: ["id_side_effect"],
    });

    // Map the IDs of the user side effects
    const sideEffectIDs = userSideEffects.map(effect => effect.id_side_effect);
    
    // If no side effects found, return an empty result set
    if (!sideEffectIDs.length) {
      return res.status(200).json({
        success: true,
        totalItems: 0,
        totalPages: 0,
        currentPage: parseInt(page),
        data: [],
      });
    }

    // Add side effect IDs to where clause for filtering recommendations
    whereClause.id_side_effect = sideEffectIDs;

    // Fetch recommendations with the applied filters, pagination, and include relations
    const { count, rows } = await Recomendation.findAndCountAll({
      where: whereClause, // Filter recommendations
      offset, // Pagination offset
      limit, // Pagination limit
      include: [
        {
          model: Educations, // Education model
          as: "education", // Alias for the model
          attributes: [
            "id_education", "title", "content", "video_link", "thumbnail", "status"
          ],
          where: EducationWhereClause, // Apply education filter if provided
        },
        {
          model: SideEffects, // Side effect model
          as: "sideEffect", // Alias for the model
          attributes: [
            "id_side_effect", "effect_name", "effect_detail", "status"
          ],
        },
      ],
    });

    // Return response with pagination and data
    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: parseInt(page),
      data: rows,
    });
  } catch (error) {
    // Handle any errors
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
  getRecomendation,
};
