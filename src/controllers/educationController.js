const {
  validationResult
} = require("express-validator");
const {
  Educations,
  Recomendation,
  SideEffects,
  EducationReadLog
} = require("../models");
const fs = require("fs");
const path = require("path");
const {
  Op
} = require("sequelize");
const moment = require('moment')

// list education on detail user
const getEducationOnDetailUser = async (req, res) => {
  try {
    // Pagination and filter parameters
    let { page = 1, pageSize = 10 } = req.body;
    let { status = "active", id_user } = req.body.filter || {};
    if (!id_user) {
      id_user = req.user.id_user;
    }
    // Build where clause for education based on status and type
    let EducationWhereClause = { status };

    // Pagination settings
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    // Handle filtering educations without recommendations
    let includeClause = [
      {
        model: EducationReadLog,
        as: 'readLog',
        where: { id_user },
        required: true
      },
    ];

      // Query to get educations
      const educations = await Educations.findAndCountAll({
        where: EducationWhereClause,
        offset,
        limit,
        distinct: true, // Ensure distinct count for pagination
        include: includeClause,
        attributes: { exclude: ['content'] }
      });

    // Format the response data
    if (educations && educations.rows && educations.rows.length) {
      educations.rows = educations.rows.map((education) => {
        const educationData = {
          id_education: education.id_education,
          title: education.title,
          // content: education.content,
          video_link: education.video_link,
          thumbnail: education.thumbnail,
          status: education.status,
          createdAt: education.createdAt,
          updatedAt: education.updatedAt,
          readLog: education.readLog
        };

        // Return the education data along with associated side effects
        return {
          ...educationData,
        };
      });
    }

    // Return the paginated response
    return res.status(200).json({
      success: true,
      totalItems: educations.count,
      totalPages: Math.ceil(educations.count / pageSize),
      currentPage: parseInt(page),
      educations: educations.rows,
    });
  } catch (error) {
    // Handle errors
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
}

// Create Education
const createEducation = async (req, res) => {
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
      title,
      content,
      video_link,
      id_side_effects,
      thumbnail_base64
    } =
    req.body;
    let thumbnail = null;

    // Handle file upload
    // if (req.file) {
    //     thumbnail = `/uploads/thumbnails/${req.file.filename}`;
    // }
    let thumbnailPath = null;
    if (thumbnail_base64) {
      // Decode base64 string
      const base64Data = thumbnail_base64.replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      const buffer = Buffer.from(base64Data, "base64");

      // Generate a unique filename
      const filename = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}.jpg`;
      const filePath = path.join(
        __dirname,
        "../..",
        "uploads",
        "thumbnails",
        filename
      );

      // Save the file
      fs.writeFileSync(filePath, buffer);
      thumbnailPath = `/uploads/thumbnails/${filename}`;
    }

    const newEducation = await Educations.create({
      title,
      content,
      video_link,
      // thumbnail,
      thumbnail: thumbnailPath,
    });

    if (
      id_side_effects &&
      (Array.isArray(id_side_effects) || id_side_effects.length >= 0)
    ) {
      const recommendations = id_side_effects.map((id_side_effect) => ({
        id_side_effect,
        id_education: newEducation.id_education,
      }));
      await Recomendation.bulkCreate(recommendations);
    }

    return res.status(201).json({
      success: true,
      message: "Education created successfully",
      data: newEducation,
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

// Get One Education
const getOneEducation = async (req, res) => {
  try {
    const {
      id_education
    } = req.params;
    const {
      read_loging = true
    } = req.body;
    console.log(id_education)
    console.log(read_loging)
    const id_user = req.user.id_user

    let education = await Educations.findOne({
      where: {
        id_education,
        status: "active",
      },
      include: [{
        model: Recomendation,
        as: 'recomendations',
        where: {
          status: 'active',
        },
        required: false,
        include: [{
          model: SideEffects, // Ensure correct model reference (Side_effects)
          as: "sideEffect",
          required: false,
        }, ],
      }, 
      {
        model: EducationReadLog,
        as: 'readLog',
        where: { id_user },
        required: false
      }
    ],
    });

    if (!education) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "Education not found",
        },
      });
    }

    let getSideEffects = [];
    if (education && education.recomendations && education.recomendations.length) {
      getSideEffects = education.recomendations.map(recomendation => recomendation.sideEffect);
    }

    // Cek apakah user sudah pernah membaca artikel ini sebelumnya
    const existingLog = await EducationReadLog.findOne({
      where: { id_user, id_education },
    });

    let eduLog = {};
    if (!existingLog && read_loging) {
      // Simpan jika belum ada catatan pembacaan
      eduLog = await EducationReadLog.create({ id_user, id_education, read_at: moment().format() });
    } else {
      // Perbarui jumlah baca dan timestamp jika sudah ada
      eduLog = await existingLog.update({ 
        read_at: moment().format(), // tanggal terbaru buka
        read_count: existingLog.read_count + 1
      });
    }

    const educationData = {
      id_education: education.id_education,
      title: education.title,
      content: education.content,
      video_link: education.video_link,
      thumbnail: education.thumbnail,
      status: education.status,
      createdAt: education.createdAt,
      updatedAt: education.updatedAt,
      readLog: eduLog
    };

    // Return education data along with side effects
    education = {
      ...educationData, // Include all the education fields
      side_effects: getSideEffects // Include side effects array
    };
    
    return res.status(200).json({
      success: true,
      data: education,
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

// Get All Educations with Pagination
const getAllEducations = async (req, res) => {
  try {
    // Pagination and filter parameters
    let { page = 1, pageSize = 10, id_user } = req.body;
    const { status = "active", tipe, side_effects_null } = req.body.filter || {};
    if (!id_user) {
      id_user = req.user.id_user;
    }
    // Build where clause for education based on status and type
    let EducationWhereClause = { status };

    if (tipe) {
      if (tipe === "video_only") {
        EducationWhereClause.video_link = { [Op.ne]: null };
      } else if (tipe === "article_only") {
        EducationWhereClause.video_link = { [Op.eq]: null };
      }
    }

    // Pagination settings
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    // Handle filtering educations without recommendations
    let includeClause = [
      {
        model: Recomendation,
        as: 'recomendations',
        where: { status: 'active' },
        required: false,
        include: [
          {
            model: SideEffects, // Include side effects model
            as: "sideEffect",
            required: false,
          },
        ],
      },
      {
        model: EducationReadLog,
        as: 'readLog',
        where: { id_user },
        required: false
      },
    ];

    if (side_effects_null) {
      // Filter educations without any recommendations
      includeClause[0].where = { id_rekomendasi: null };
    }

    // Query to get educations
    const educations = await Educations.findAndCountAll({
      where: EducationWhereClause,
      offset,
      limit,
      distinct: true, // Ensure distinct count for pagination
      include: includeClause,
    });

    // Format the response data
    if (educations && educations.rows && educations.rows.length) {
      educations.rows = educations.rows.map((education) => {
        const educationData = {
          id_education: education.id_education,
          title: education.title,
          content: education.content,
          video_link: education.video_link,
          thumbnail: education.thumbnail,
          status: education.status,
          createdAt: education.createdAt,
          updatedAt: education.updatedAt,
          readLog: education.readLog
        };

        let sideEffects = [];
        if (education.recomendations && education.recomendations.length) {
          sideEffects = education.recomendations
            .map(recomendation => recomendation.sideEffect)
            .filter(sideEffect => sideEffect); // Filter out any null side effects
        }

        // Return the education data along with associated side effects
        return {
          ...educationData,
          side_effects: sideEffects,
        };
      });
    }

    // Return the paginated response
    return res.status(200).json({
      success: true,
      totalItems: educations.count,
      totalPages: Math.ceil(educations.count / pageSize),
      currentPage: parseInt(page),
      educations: educations.rows,
    });
  } catch (error) {
    // Handle errors
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

// Update Education
const updateEducation = async (req, res) => {
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
      id_education
    } = req.params; // Get education ID from params
    const {
      title,
      content,
      video_link,
      // status,
      thumbnail_base64,
      id_side_effects,
      remove_thumbnail, // New form-data field for removing thumbnail
    } = req.body;

    // Check if education exists
    const education = await Educations.findOne({
      where: {
        id_education,
        status: "active",
      },
    });

    if (
      id_side_effects &&
      Array.isArray(id_side_effects) &&
      id_side_effects.length > 0
    ) {
      // Fetch existing recommendations for the given education
      const existingRecommendations = await Recomendation.findAll({
        where: {
          id_education: education.id_education,
          status: "active",
        },
        attributes: ["id_side_effect"], // Fetch only the `id_side_effect` field
      });

      // Extract the existing side effect IDs
      const existingSideEffectIds = existingRecommendations.map(
        (rec) => rec.id_side_effect
      );

      // Filter out the new side effects that do not already exist
      const newSideEffects = id_side_effects.filter(
        (id_side_effect) => !existingSideEffectIds.includes(id_side_effect)
      );
      const deletedSideEffects = existingSideEffectIds.filter(
        (exist_side_effect) => !id_side_effects.includes(exist_side_effect)
      );

      // If there are deleted side effects, remove them from recommendations
      if (deletedSideEffects.length > 0) {
        await Recomendation.destroy({
          where: {
            id_education: education.id_education,
            id_side_effect: deletedSideEffects,
          },
        });
      }

      // If there are new side effects, create recommendations for them
      if (newSideEffects.length > 0) {
        const newRecommendations = newSideEffects.map((id_side_effect) => ({
          id_side_effect,
          id_education: education.id_education,
        }));

        await Recomendation.bulkCreate(newRecommendations);
      }
    }

    if (!education) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "Education not found",
        },
      });
    }

    // Handle file upload (if a new thumbnail is uploaded)
    let thumbnailPath = education.thumbnail; // Use the existing thumbnail if none is uploaded
    // if (req.file) {
    //     thumbnailPath = req.file.path; // Update with the new thumbnail path
    // }
    if (thumbnail_base64 && !remove_thumbnail) {
      // Remove old thumbnail if exists
      if (education.thumbnail) {
        const oldFilePath = path.join(
          __dirname,
          "../..",
          "uploads",
          "thumbnails",
          path.basename(education.thumbnail)
        );
        fs.unlink(oldFilePath, (err) => {
          if (err) {
            console.error("Error removing old thumbnail file:", err);
          }
        });
      }

      // Decode base64 string
      const base64Data = thumbnail_base64.replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      const buffer = Buffer.from(base64Data, "base64");

      // Generate a unique filename
      const filename = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}.jpg`;
      const filePath = path.join(
        __dirname,
        "../..",
        "uploads",
        "thumbnails",
        filename
      );

      // Save the file
      fs.writeFileSync(filePath, buffer);
      thumbnailPath = `/uploads/thumbnails/${filename}`;
    }

    // Handle removal of the thumbnail if requested
    if (remove_thumbnail == true) {
      if (education.thumbnail) {
        const filePath = path.join(
          __dirname,
          "../..",
          "uploads",
          "thumbnails",
          path.basename(education.thumbnail)
        );
        // Update the path to point directly to the correct directory
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error removing thumbnail file:", err);
          } else {
            console.log("Thumbnail file removed successfully");
          }
        });
        thumbnailPath = null;
      }
    }

    // Update the education record
    await education.update({
      title,
      content,
      video_link,
      thumbnail: thumbnailPath, // Use the new or existing (or null if removed) thumbnail path
      // status,
    });

    return res.status(200).json({
      success: true,
      message: "Education updated successfully",
      data: education,
    });
  } catch (error) {
    console.error("Error updating education:", error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

// Soft Delete Education
const deleteEducation = async (req, res) => {
  try {
    const {
      id_education
    } = req.params;

    const education = await Educations.findOne({
      where: {
        id_education,
        status: "active",
      },
    });

    if (!education) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "Education not found",
        },
      });
    }

    if (education.thumbnail) {
      const filePath = path.join(
        __dirname,
        "../..",
        "uploads",
        "thumbnails",
        path.basename(education.thumbnail)
      );
      // Update the path to point directly to the correct directory
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error removing thumbnail file:", err);
        } else {
          console.log("Thumbnail file removed successfully");
        }
      });
      thumbnailPath = null;
    }

    await education.update({
      status: "deleted",
      deletedAt: new Date()
    });

    // Update related recommendations to 'deleted'
    await Recomendation.update({
      status: "deleted",
      deletedAt: new Date()
    }, {
      where: {
        id_education,
        status: "active"
      }
    });

    return res.status(200).json({
      success: true,
      message: "Education deleted successfully",
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

// to log education read
const createLogRead = async (req, res) => {
  try {
    let { id_user, id_education } = req.body;

    if (!id_user) {
      id_user = req.user.id_user;
    }

    const education = await Educations.findOne({
      where: { id_education }
    });

    if (!education) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "Education not found",
        },
      });
    }
    // Cek apakah user sudah pernah membaca artikel ini sebelumnya
    const existingLog = await EducationReadLog.findOne({
      where: { id_user, id_education },
    });

    let eduLog = {};
    if (!existingLog) {
      // Simpan jika belum ada catatan pembacaan
      eduLog = await EducationReadLog.create({ id_user, id_education, read_at: moment().format() });
    } else {
      // Perbarui jumlah baca dan timestamp jika sudah ada
      eduLog = await existingLog.update({ 
        read_at: moment().format(), // tanggal terbaru buka
        read_count: existingLog.read_count + 1
      });
    }

    return res.status(200).json({
      success: true,
      message: `Artikel "${education.title}" telah dibaca`,
      data: {
        id_education,
        title: education.title,
        status: education.status,
        readLog: eduLog
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      error: error.message,
    });
  }
};

const getOneLogRead = async (req, res) => {
  try {
    let { id_education } = req.params;

    let id_user = req.user.id_user;
    
    const readArticles = await EducationReadLog.findAll({
      where: { id_user, id_education },
      include: [
        {
          model: Educations,
          as: 'education',
          attributes: ['id_education', 'title'],
        },
      ],
      attributes: ['id_education', 'read_at', 'read_count'],
    });

    return res.status(200).json({
      success: true,
      data: readArticles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      error: error.message,
    });
  }
};

const getAllEducationsReadLog = async (req, res) => {
  try {
    // Pagination and filter parameters
    let { page = 1, pageSize = 10 } = req.body;
    let { id_education, id_user } = req.body.filter || {};
    if (!id_user) {
      id_user = req.user.id_user;
    }
    // Build where clause for education based on status and type
    let EducationWhereClause = { };
    if (id_education) {
      EducationWhereClause = {
        ...EducationWhereClause,
        id_education: id_education
      };
    }
    // Pagination settings
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    // Query to get educations
    const readLogs = await EducationReadLog.findAndCountAll({
      where: EducationWhereClause,
      offset,
      limit,
      distinct: true, // Ensure distinct count for pagination
      include: [
        {
          model: Educations,
          as: 'education',
          required: false
        }
      ]
    });

    // Format the response data
    if (readLogs && readLogs.rows && readLogs.rows.length) {
      readLogs.rows = readLogs.rows.map((log) => {
        const logData = {
          id_read_log: log.id_read_log,
          id_user: log.id_user,
          id_education: log.id_education,
          read_at: log.read_at,
          read_count: log.read_count,
          createdAt: log.createdAt,
          updatedAt: log.updatedAt,
          education: log.education
        };

        // Return the education data along with associated side effects
        return {
          ...logData
        };
      });
    }

    // Return the paginated response
    return res.status(200).json({
      success: true,
      totalItems: readLogs.count,
      totalPages: Math.ceil(readLogs.count / pageSize),
      currentPage: parseInt(page),
      data: readLogs.rows,
    });
  } catch (error) {
    // Handle errors
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
  getOneLogRead,
  createLogRead,
  createEducation,
  getOneEducation,
  getAllEducations,
  updateEducation,
  deleteEducation,
  getAllEducationsReadLog,
  getEducationOnDetailUser
};