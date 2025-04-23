const express = require('express');
const app = express();
const userController = require('../controllers/userController');
const diagnoseController = require('../controllers/diagnoseController');
const sideEffectController = require('../controllers/sideEffectController');
const educationController = require('../controllers/educationController');
const chemoSchController = require('../controllers/chemoSchController');
const userSideEffectController = require('../controllers/userSideEffectController');
const recomendationController = require('../controllers/recomendationController');
const monitoringLabController = require('../controllers/monitoringLabController');
const drugSchController = require('../controllers/drugSchController');
const drugConsumeTimeController = require('../controllers/drugConsumeTimeController');
const notificationController = require('../controllers/notificationController');
const sessionLogController = require('../controllers/sessionLogController');

// validator
const userValidator = require('../validations/userValidator');
const loginValidator = require('../validations/loginValidator');
const diagnoseValidator = require('../validations/diagnoseValidator');
const sideEffectValidator = require('../validations/sideEfectValidator');
const {
    educationValidatorCreate,
    educationValidatorUpdate
} = require('../validations/educationValidator');
const chemoSchValidator = require('../validations/chemoSchValidator');
const userSideEffectValidator = require('../validations/userSideEffectValidator');
const monitoringLabValidator = require('../validations/monitoringLabValidator')
const drugSchValidator = require('../validations/drugValidator')
const drugConsumeValidator = require('../validations/drugConsumeValidator')

// middleware
const authMiddleware = require('../middlewares/authMiddleware')
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const validateFcm = require('../validations/fcmValidator');


const apiRouter = express.Router();
const api = express.Router();

// User Routes
apiRouter.post('/login', loginValidator, userController.login); // Login user
apiRouter.post('/verify_google', userController.verifyWithGoogle);
apiRouter.get('/verify_google', userController.verifyWithGoogle);

api.get('/reset/:token', userController.verifyEmail);
// api.get('/verify_email/:token', userController.verifyProcess);
apiRouter.post('/auth/lupaPassword', authMiddleware, userController.forgotPassword);
apiRouter.post('/auth/verifyEmail/:token', userController.verifyEmail);

apiRouter.post('/users/log_access', authMiddleware, userController.logUserAccess); // Create a new user
// User Route
apiRouter.get('/users', authMiddleware, userController.getAllUsers); // View all user
apiRouter.get('/users/:id_user', authMiddleware, userController.getOneUsers); // View user
apiRouter.post('/users/create', userValidator, userController.createUser); // Create a new user
apiRouter.put('/users/update/:id_user', authMiddleware, userController.updateUser); // Update a new user
apiRouter.delete('/users/delete/:id_user', authMiddleware, userController.deleteUser); // Delete user

// Diagnose Route
apiRouter.get('/diagnose', authMiddleware, diagnoseController.getAllDiagnoses); // View all user
apiRouter.get('/diagnose/:id_diagnose', authMiddleware, diagnoseController.getOneDiagnose); // View user
apiRouter.post('/diagnose/create', authMiddleware, diagnoseValidator, diagnoseController.createDiagnose); // Create a new user
apiRouter.put('/diagnose/update/:id_diagnose', authMiddleware, diagnoseValidator, diagnoseController.updateDiagnose); // Update a new user
apiRouter.delete('/diagnose/delete/:id_diagnose', authMiddleware, diagnoseController.deleteDiagnose); // Delete user

// Side Effect Route
apiRouter.get('/side_effect', authMiddleware, sideEffectController.getAllSideEffects); // View all user
apiRouter.get('/side_effect/:id_side_effect', authMiddleware, sideEffectController.getOneSideEffect); // View user
apiRouter.post('/side_effect/create', authMiddleware, sideEffectValidator, sideEffectController.createSideEffect); // Create a new user
apiRouter.put('/side_effect/update/:id_side_effect', authMiddleware, sideEffectValidator, sideEffectController.updateSideEffect); // Update a new user
apiRouter.delete('/side_effect/delete/:id_side_effect', authMiddleware, sideEffectController.deleteSideEffect); // Delete user

// Education Route
apiRouter.get('/education/read-by-user', authMiddleware, educationController.getEducationOnDetailUser); // list education on detail user
apiRouter.get('/education', authMiddleware, educationController.getAllEducations); // View all user
apiRouter.get('/education/:id_education', authMiddleware, educationController.getOneEducation); // View user
apiRouter.post('/education/create', authMiddleware, uploadMiddleware.single('thumbnail'), educationValidatorCreate, educationController.createEducation); // Create a new user
apiRouter.put('/education/update/:id_education', authMiddleware, uploadMiddleware.single('thumbnail'), educationValidatorUpdate, educationController.updateEducation); // Update a new user
apiRouter.delete('/education/delete/:id_education', authMiddleware, educationController.deleteEducation); // Delete user

// education read
apiRouter.get('/education/log/all', authMiddleware, educationController.getAllEducationsReadLog); // Create a new user
apiRouter.get('/education/log/:id_education', authMiddleware, educationController.getOneLogRead); // View user
apiRouter.post('/education/log/create', authMiddleware, educationController.createLogRead); // Create a new user

apiRouter.get('/recomendation', authMiddleware, recomendationController.getRecomendation);

//
apiRouter.post("/session/start", authMiddleware, sessionLogController.startSession);
apiRouter.post("/session/end", authMiddleware, sessionLogController.endSession);
apiRouter.get("/session/total-usage", authMiddleware, sessionLogController.getAllUsageSession);
apiRouter.get("/session/total-usage/:id_session", authMiddleware, sessionLogController.getOneUsageSession);

// Chemo Schedule Route
apiRouter.get('/chemo', authMiddleware, chemoSchController.getAllChemoSchedules); // View all user
apiRouter.get('/chemo/:id_chemoSchedule', authMiddleware, chemoSchController.getOneChemoSchedule); // View user
apiRouter.post('/chemo/create', authMiddleware, chemoSchValidator, chemoSchController.createChemoSchedule); // Create a new user
apiRouter.put('/chemo/update/:id_chemoSchedule', authMiddleware, chemoSchValidator, chemoSchController.updateChemoSchedule); // Update a new user
apiRouter.delete('/chemo/delete/:id_chemoSchedule', authMiddleware, chemoSchController.deleteChemoSchedule); // Delete user

// user Side Effect Route
apiRouter.get('/user_side_effect_group_pagination', authMiddleware, userSideEffectController.getAllUserSideEffectsGroupBySQL); // View all user
apiRouter.get('/user_side_effect_group', authMiddleware, userSideEffectController.getAllUserSideEffectsGroup); // View all user
apiRouter.get('/user_side_effect', authMiddleware, userSideEffectController.getAllUserSideEffects); // View all user
apiRouter.get('/user_side_effect/:id_user_side_effect', authMiddleware, userSideEffectController.getOneUserSideEffect); // View user
apiRouter.post('/user_side_effect/create', authMiddleware, userSideEffectValidator, userSideEffectController.createUserSideEffect); // Create a new user
apiRouter.put('/user_side_effect/update/:id_user_side_effect', authMiddleware, userSideEffectValidator, userSideEffectController.updateUserSideEffect); // Update a new user
apiRouter.delete('/user_side_effect/delete/:id_user_side_effect', authMiddleware, userSideEffectController.deleteUserSideEffect); // Delete user

// monitoring laboratorium Route
apiRouter.get('/monitoring_lab', authMiddleware, monitoringLabController.getAllMonitoringLab); // View all user
apiRouter.get('/monitoring_lab/chart', authMiddleware, monitoringLabController.getAllMonitoringLabChart); // View all user
apiRouter.get('/monitoring_lab/:id_monitoring_lab', authMiddleware, monitoringLabController.getOneMonitorLab); // View user
apiRouter.post('/monitoring_lab/create', authMiddleware, monitoringLabValidator, monitoringLabController.createMonitorLab); // Create a new user
apiRouter.put('/monitoring_lab/update/:id_monitoring_lab', authMiddleware, monitoringLabValidator, monitoringLabController.updateMonitorLab); // Update a new user
apiRouter.delete('/monitoring_lab/delete/:id_monitoring_lab', authMiddleware, monitoringLabController.deleteMonitorLab); // Delete user

// drug schedule Route
apiRouter.get('/drug_schedule/with_date', authMiddleware, drugSchController.getAllDrugSchedulesWithDate); // View all user
apiRouter.get('/drug_schedule', authMiddleware, drugSchController.getAllDrugSchedules); // View all user
apiRouter.get('/drug_schedule/:id_drug_schedule', authMiddleware, drugSchController.getOneDrugSchdules); // View user
apiRouter.post('/drug_schedule/create', authMiddleware, drugSchValidator, drugSchController.createDrugSchedule); // Create a new user
apiRouter.put('/drug_schedule/update/:id_drug_schedule', authMiddleware, drugSchValidator, drugSchController.updateDrugSchedule); // Update a new user
apiRouter.delete('/drug_schedule/delete/:id_drug_schedule', authMiddleware, drugSchController.deleteDrugSchedule); // Delete user

apiRouter.get('/drug_consume_time', authMiddleware, drugConsumeTimeController.getAllDrugConsumeTimes); // View all user
apiRouter.get('/drug_consume_time/:id_drug_consume_time', authMiddleware, drugConsumeTimeController.GetOneDrugConsumeTime); // View user
apiRouter.post('/drug_consume_time/create', authMiddleware, drugConsumeValidator, drugConsumeTimeController.createDrugConsumeTime); // Create a new user
apiRouter.put('/drug_consume_time/update/:id_drug_consume_time', authMiddleware, drugConsumeTimeController.updateDrugConsumeTime); // Update a new user
apiRouter.delete('/drug_consume_time/delete/:id_drug_consume_time', authMiddleware, drugConsumeTimeController.deleteDrugConsumeTime); // Delete user

// fcm token route
apiRouter.post('/fcm/store', authMiddleware, validateFcm, notificationController.storeFCMtoken); // Create a new user

// notification route
apiRouter.get('/notification', authMiddleware, notificationController.getAllNotifications)
apiRouter.get('/notification/:id_notification_sent', authMiddleware, notificationController.getOneNotification)

// view router
const jwt = require('jsonwebtoken');
const User = require("../models/userModel");
const {
    Op
} = require('sequelize');

async function emailIsAlreadyVerified(email) {
    return await User.findOne({
        where: {
            email,
            status: "active",
            email_verified_at: {
                [Op.not]: null, // Check that email_verified_at is NOT null
            },
        },
    });
}

api.get('/verify_email/:token', async (req, res) => {
    const {
        token
    } = req.params;
    let status = 'success'; // Default status
    let title;
    console.log(token)
    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the email has already been verified
        const user = await emailIsAlreadyVerified(decoded.email);

        if (user) { // If the user is found, it means email is already verified
            status = 'already_verified';
        } else {
            // Optionally handle the logic for marking email as verified here
            // Example: Update the user record to set email_verified_at
            await User.update({
                email_verified_at: new Date()
            }, {
                where: {
                    email: decoded.email
                }
            });
            status = 'success'; // Set this to success if you mark it as verified
        }

    } catch (error) {
        console.error('Invalid or expired token', error);
        status = 'failed'; // Set status to failed if token verification fails
    }

    // Set the title based on the status
    if (status === 'success') {
        title = 'Konfirmasi Email Berhasil';
    } else if (status === 'failed') {
        title = 'Konfirmasi Email Gagal';
    } else if (status === 'already_verified') {
        title = 'Email Sudah Terkonfirmasi';
    }

    // Render the dynamic page with title and status
    res.render('verificationEmailResult', {
        title,
        status
    });
});


api.post('/update_password/api/update_password', async (req, res) => {
    try {
        // Destructure the password and id_user from the request body
        let {
            password,
            id_user
        } = req.body;

        // Check if both fields are provided
        if (!password || !id_user) {
            return res.status(400).json({
                success: false,
                message: 'Password and user ID are required',
            });
        }
        // Find the user by id_user
        const user = await User.findOne({
            where: {
                id_user: id_user
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Hash the new password using bcrypt
        let hashPassword = userController.encrypt(password, process.env.SALT);

        // Update the user's password in the database
        user.password = hashPassword;
        await user.save();

        // Respond with success
        res.status(200).json({
            success: true,
            message: 'Password updated successfully',
        });



    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error updating password:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the password',
        });
    }
});

api.get('/update_password/:token', async (req, res) => {
    const {
        token
    } = req.params;
    let status = 'success'; // Default status
    let title;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        res.render('updatePassword', {
            id_user: decoded.id_user
        });

    } catch (error) {
        console.error('Invalid or expired token', error);
        status = 'failed'; // Set status to failed if token verification fails
    }

    // Set the title based on the status
    if (status === 'success') {
        title = 'Konfirmasi Email Berhasil';
    } else if (status === 'failed') {
        title = 'Update Password Gagal';
        res.render('verificationEmailResult', {
            title,
            status
        });
    }

    // Render the dynamic page with title and status
});

module.exports = {
    apiRouter,
    api
};