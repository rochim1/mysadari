const {
  validationResult
} = require("express-validator");
const {
  Educations,
  Recomendation,
  DrugSchedule
} = require("../models");
const fs = require("fs");
const path = require("path");
const {
  Op
} = require("sequelize");
const User = require("../models/userModel");
const ChemoSchedule = require('../models/chemoSchModel');
const {
  NotificationSent, DrugConsumeTime
} = require('../models/index');
const firebaseConfig = require('../services/messaging.service.js');
const admin = require('firebase-admin'); // Ensure admin is imported
// Create Education
const pushNotification = async ({
  fcm_token = null,
  title = "",
  body = "",
  multi_fcm_token = [],
  attribute,
  data
}) => {
  try {
    // Initialize Firebase app
    if (!admin) {
      console.error("Firebase Admin SDK is not initialized.");
      return {
        success: false,
        response: "Firebase Admin SDK is not initialized."
      };
    }

    let app = await firebaseConfig.initializeAppFirebase(admin);
    console.log("Initialized Firebase App:");
    
    const notification = {
      notification: {
        title,
        body,
      },
      webpush: {
        fcmOptions: attribute,
      },
      android: {
        notification: {
          sound: 'custom_midi_sound', // Name of your MIDI sound file
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'custom_midi_sound.mid', // Specify custom sound for iOS
          },
        },
      },
      data: data
    };

    if (fcm_token) {
      // Send notification to a single device token
      const message = {
        ...notification,
        token: fcm_token,
      };

      console.log('message', message)
      const response = await admin.messaging().send(message);
      console.log('response', response)
      return {
        success: true,
        response,
      };
    }

    if (multi_fcm_token && multi_fcm_token.length > 0) {
      // Send notification to multiple device tokens
      const multicastMessage = {
        ...notification,
        tokens: multi_fcm_token,
      };

      const response = await admin.messaging().sendMulticast(multicastMessage);
      return {
        success: true,
        response,
      };
    }

    return {
      success: false,
      response: "No fcm_token or multi_fcm_token provided.",
    };
  } catch (err) {
    console.log('error sending message fcm', err)
    return {
      success: false,
      response: err.message,
    };
  }
};

const storeFCMtoken = async (req, res) => {
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
      fcm_token
    } = req.body;

    if (!id_user) {
      id_user = req.user.id_user;
    }

    // Find the user by ID
    const user = await User.findOne({
      where: {
        id_user,
        status: "active",
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "User not found",
        },
      });
    }

    await user.update({
      fcm_token
    });

    // Respond with updated user details
    res.status(200).json({
      success: true,
      message: "FCM token stored successfully",
      data: user,
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

const getAllNotifications = async (req, res) => {
  try {
    const {
      page = 1, pageSize = 10
    } = req.body;

    let {
      status,
      id_user,
    } =
    req.body && req.body.filter ? req.body.filter : {
      status: "active"
    };

    let whereClause = {
      status,
      ...(id_user && {
        receiver: id_user
      }),
    };

    if (req.body && req.body.filter && req.body.filter) {
      const filter = req.body.filter
      if (filter.tipe) {
        whereClause.tipe = tipe
      }
    }

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    console.log(whereClause)
    const {
      count,
      rows
    } = await NotificationSent.findAndCountAll({
      where: whereClause,
      offset,
      limit,
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

const getOneNotification = async (req, res) => {
  try {
    const {
      id_notification_sent
    } = req.params;

    const notificationData = await NotificationSent.findOne({
      where: {
        id_notification_sent,
        status: "active",
      },
      include: [{
        model: ChemoSchedule,
        as: 'chemo_schedule',
        required: false,
      }, {
        model: DrugConsumeTime, // Ensure correct model reference (Side_effects)
        as: "drug_consume_time",
        required: false,
        include: [{
          model: DrugSchedule, // Ensure correct model reference (Side_effects)
          as: "drug_schedule",
          required: false,
        }]
      }],
    });

    if (!notificationData) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "notification not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: notificationData,
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
  storeFCMtoken,
  pushNotification,
  getAllNotifications,
  getOneNotification
};