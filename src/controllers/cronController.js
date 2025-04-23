const cron = require('node-cron');
const moment = require('moment');
const momentz = require('moment-timezone');
// const { sendNotification } = require('./notificationService');
const ChemoSchedule = require("../models/chemoSchModel");
const {
    DrugSchedule,
    DrugConsumeTime
} = require('../models/index');
const notificationSent = require('../models/notificationSentModel');
const notificationController = require('./notificationController');
const Users = require('../models/userModel');

const listCronJobs = [{
    trigger_name: "consume_drug_notif",
    trigger_date: `0 0 23 31 12 *`,
    func: ['triggerConsumeDrugNotif']
}, {
    trigger_name: "update_chemo_terapy_notif",
    trigger_date: `0 0 0 * * *`,
    func: ['triggerChemoTerapyNotif']
}];

// Function to convert cron time to WIB
// Function to convert cron time to WIB
const convertToWIB = (cronExpression) => {
    // Split the cron expression into its components
    const cronParts = cronExpression.split(' ');

    // Check if it includes seconds and set the variables accordingly
    let second, minute, hour, day, month, dayOfWeek;

    if (cronParts.length === 6) {
        // Includes seconds
        [second, minute, hour, day, month, dayOfWeek] = cronParts;
    } else if (cronParts.length === 5) {
        // Does not include seconds
        [minute, hour, day, month, dayOfWeek] = cronParts;
        second = 0; // Default to 0 if not specified
    } else {
        throw new Error('Invalid cron expression');
    }

    // Create a moment object in server time (assuming CDT here as an example)
    const serverTime = moment.tz({ second, minute, hour, day, month: month - 1 }, 'America/Chicago');

    // Convert to WIB (Asia/Jakarta)
    const wibTime = serverTime.clone().tz('Asia/Jakarta');

    // Reformat the cron expression using WIB values
    const newCronExpression = `${wibTime.second()} ${wibTime.minute()} ${wibTime.hour()} ${wibTime.date()} ${wibTime.month() + 1} ${dayOfWeek ? dayOfWeek : '*'}`;

    return newCronExpression;
};

// *****************************************************************************
const initializeCronJobs = () => {
    // Initialize cron chemo_jobs at server start
    initializeImmediatlyNotifSchdule();
    initializeImmediatlyNotifSchduleDrug();

    // Schedule the job to recheck and update all chemo_jobs every midnight
    initializeMidnightJob();
};

let chemo_jobs = {};
let drug_jobs = {};

const initializeMidnightJob = () => {
    // Schedule the job to run every midnight
    const cronInfo = listCronJobs.find(data => data.trigger_name == "update_chemo_terapy_notif");
    let trigger_date = cronInfo.trigger_date;

    const job = cron.schedule(trigger_date, () => {
        initializeImmediatlyNotifSchdule(); // Call the function to stop and update chemo_jobs at midnight
    });

    console.log('Midnight cron job initialized.');
};

const initializeImmediatlyNotifSchdule = () => {
    try {
        // Stop all current scheduled chemo_jobs
        stopAllJobs('chemotherapy');

        // Fetch and reschedule all chemotherapy notifications
        triggerChemoTerapyNotif();

        console.log("All chemotherapy notification chemo_jobs have been reinitialized.");
    } catch (error) {
        console.log('Failed to update chemotherapy cron chemo_jobs', error);
    }
};

const initializeImmediatlyNotifSchduleDrug = () => {
    try {
        // Stop all current scheduled chemo_jobs
        stopAllJobs('drug_consume_time');

        // Fetch and reschedule all chemotherapy notifications
        triggerDrugNotif();

        console.log("All chemotherapy notification chemo_jobs have been reinitialized.");
    } catch (error) {
        console.log('Failed to update chemotherapy cron chemo_jobs', error);
    }
};

// Function to trigger chemotherapy notifications
const triggerChemoTerapyNotif = async (req, res) => {
    try {
        const chunkSize = 100;
        let offset = 0;
        let hasMoreData = true;

        while (hasMoreData) {
            // Fetch a chunk of data using limit and offset
            const schedules = await ChemoSchedule.findAll({
                limit: chunkSize,
                offset: offset,
                order: [
                    ['updatedAt', 'DESC']
                ],
                where: {
                    status: 'active',
                    is_sent: false
                }
            });

            // If no more data is returned, exit the loop
            if (schedules.length === 0) {
                hasMoreData = false;
                break;
            }

            // Process each schedule
            for (let schedule of schedules) {
                // Schedule notifications for each schedule
                let notifTime = momentz(`${schedule.tanggal_kemoterapi} ${schedule.waktu_kemoterapi}`, 'YYYY-MM-DD HH:mm').subtract(schedule.remember_before_minutes, 'minutes').startOf('minute');

                if (notifTime.isSameOrAfter(moment().startOf('minute'))) {
                    await scheduleNotification(schedule, 'chemotherapy');
                }
            }

            // Move to the next chunk
            offset += chunkSize;
        }
    } catch (error) {
        console.error('Error triggering chemotherapy notifications:', error);
    }
};

const triggerDrugNotif = async (req, res) => {
    try {
        const chunkSize = 100;
        let offset = 0;
        let hasMoreData = true;

        while (hasMoreData) {
            const schedules = await DrugConsumeTime.findAll({
                limit: chunkSize,
                offset: offset,
                order: [
                    ['updatedAt', 'DESC']
                ],
                where: {
                    status: 'active',
                    is_sent: false
                },
                // include: [{
                //     model: DrugSchedule,
                //     as: 'drug_schedule', // Optional alias
                //     required: true, // Inner join, set to false for outer join
                // }, ],
            });

            // If no more data is returned, exit the loop
            if (schedules.length === 0) {
                hasMoreData = false;
                break;
            }

            // Process each schedule
            for (let schedule of schedules) {
                // Schedule notifications for each schedule
                const notifTime = momentz(`${schedule.date} ${schedule.time}`, 'YYYY-MM-DD HH:mm').startOf('minute');

                if (notifTime.isSameOrAfter(moment().startOf('minute'))) {
                    await scheduleNotification(schedule, 'DrugConsumeTime');
                }
            }

            // Move to the next chunk
            offset += chunkSize;
        }
    } catch (error) {
        console.error('Error triggering chemotherapy notifications:', error);
    }
};

// Function to schedule a notification for a specific schedule
const scheduleNotification = async (schedule, tipe) => {
    try {
        let job;
        if (tipe == 'chemotherapy') {

            let chemoDateTime = momentz.tz(`${schedule.tanggal_kemoterapi} ${schedule.waktu_kemoterapi}`, 'YYYY-MM-DD HH:mm', 'Asia/Jakarta');

            if (schedule.remember_before_minutes) {
                chemoDateTime = chemoDateTime.subtract(schedule.remember_before_minutes, 'minutes');
            }
            // Format the datetime to match the cron format (seconds minutes hours day month day-of-week)
            const notificationTime = chemoDateTime.format('s m H D M * YYYY');
            // Schedule a job based on the user's notification time
            job = cron.schedule(notificationTime, () => {
                // Call the notification sending logic here
                console.log('masuk cron jadwal kemo terapi', notificationTime)
                sendNotification(schedule, 'chemotherapy');
            });

            // Store the job instance with the schedule for later updates or stopping
            chemo_jobs[schedule.id_chemoSchedule] = job;

        } else if (tipe == 'drug_consume_time') {

            let drugConsumeTime = momentz.tz(`${schedule.date} ${schedule.time}`, 'YYYY-MM-DD HH:mm', 'Asia/Jakarta');

            // const periode = schedule.drug_schedule && schedule.drug_schedule.periode ? schedule.drug_schedule.periode : ''

            const notificationTime = drugConsumeTime.format('s m H D M * YYYY');
            console.log(notificationTime)
            // Schedule a job based on the user's notification time
            job = cron.schedule(notificationTime, () => {
                // Call the notification sending logic here
                console.log('send_notif consume time on', moment)
                sendNotification(schedule, 'drug_consume_time');
            });

            drug_jobs[schedule.id_drug_consume_time] = job;
        }

        // Return the job instance if needed
        return job;

    } catch (error) {
        console.error(`Error scheduling notification: ${error.message}`);
    }
};

// Function to stop a scheduled job (e.g., on update)
const stopScheduledJob = (scheduleId, tipe) => {
    if (tipe == 'chemotherapy') {
        const job = chemo_jobs[scheduleId];
        if (job) {
            job.stop(); // Stop the cron job
            delete chemo_jobs[scheduleId]; // Remove the job from the in-memory store
        }
    } else if (tipe == 'drug_consume_time') {
        const job = drug_jobs[scheduleId];
        if (job) {
            job.stop(); // Stop the cron job
            delete drug_jobs[scheduleId]; // Remove the job from the in-memory store
        }
    }
};

const stopAllJobs = (tipe) => {
    if (tipe == 'chemotherapy') {
        Object.keys(chemo_jobs).forEach(scheduleId => {
            if (chemo_jobs[scheduleId]) {
                chemo_jobs[scheduleId].stop(); // Stop the job
                console.log(`Job for chemo schedule ${scheduleId} stopped`);
            }
        });

        Object.keys(chemo_jobs).forEach(scheduleId => delete chemo_jobs[scheduleId]);
    } else if (tipe == 'drug_consume_time') {
        Object.keys(drug_jobs).forEach(scheduleId => {
            if (drug_jobs[scheduleId]) {
                drug_jobs[scheduleId].stop(); // Stop the job
                console.log(`Job for drug schedule ${scheduleId} stopped`);
            }
        });

        Object.keys(drug_jobs).forEach(scheduleId => delete drug_jobs[scheduleId]);
    }

    console.log('All chemo_jobs have been stopped.');
};
// Function to update notification schedule
const updateNotificationSchedule = async (schedule, tipe = 'chemotherapy') => {
    if (tipe == 'chemotherapy') {
        stopScheduledJob(schedule.id_chemoSchedule, tipe);
    } else if (tipe == 'drug_consume_time') {
        stopScheduledJob(schedule.id_drug_consume_time, tipe);
    }

    await scheduleNotification(schedule, tipe);
};

// Function to send notifications (SMS, Email, Push Notification, etc.)
const sendNotification = async (schedule, tipe) => {
    try {

        const user = await Users.findOne({
            where: {
                id_user: schedule.id_user,
                status: 'active'
            }
        })

        console.log(user.fcm_token)
        // if (!user || (user && !user.fcm_token)) {
        //     return false;
        // }


        if (tipe == 'chemotherapy') {

            let attribute = {
                fcm_token: user.fcm_token || null,
                title: '⏰ pengingat jadwal kunjungan',
                body: `Sesi ${schedule.tujuan_kemoterapi} Anda akan dimulai dalam ${schedule.remember_before_minutes || 0 } menit. Siapkan diri Anda dengan baik.`,
                receiver: schedule.id_user,
                sender: 'system',
                tipe: 'chemotherapy',
                attribute: {
                    link: '/notification'
                }
            }

            const notification = await notificationSent.create({
                ...attribute,
                id_chemoSchedule: schedule.id_chemoSchedule ? schedule.id_chemoSchedule : null
            })

            attribute.data = { 
                id: notification.id_notification_sent
            }

            if (user.fcm_token) {
                notificationController.pushNotification(attribute)
            }

            await ChemoSchedule.update({
                is_sent: true
            }, {
                where: {
                    id_chemoSchedule: schedule.id_chemoSchedule
                }
            });

            stopScheduledJob(schedule, 'chemotherapy');
            console.log(`Sending chemotherapy reminder to user: ${schedule.id_user} for schedule ID: ${schedule.id_chemoSchedule}`);
        } else if (tipe == 'drug_consume_time') {

            const attribute = {
                fcm_token: user.fcm_token || null,
                title: '⏰ pengingat jadwal minum obat',
                body: `Saatnya minum obat ${schedule.name || ''}! Jangan lupa untuk menjaga kesehatan dengan mengikuti jadwal obat Anda.`,
                receiver: schedule.id_user,
                sender: 'system',
                tipe: 'drug_consume_time',
                attribute: {
                    link: '/notification'
                }
            }

            const notification = await notificationSent.create({
                ...attribute,
                id_drug_consume_time: schedule.id_drug_consume_time ? schedule.id_drug_consume_time : null
            });

            attribute.data = { 
                id: notification.id_notification_sent
            }

            if (user.fcm_token) {
                notificationController.pushNotification(attribute)
            }

            await DrugConsumeTime.update({
                is_sent: true
            }, {
                where: {
                    id_drug_consume_time: schedule.id_drug_consume_time
                }
            });

            stopScheduledJob(schedule, 'drug_consume_time');
            console.log(`Sending drug consume time reminder`);
        }
    } catch (error) {
        console.log('failed to send message', error);
    }
};

const getHoursAndMinutes = (timesArray) => {
    return timesArray.map(time => {
        const [hour, minute] = time.split(":");
        return {
            hour: parseInt(hour),
            minute: parseInt(minute)
        }; // Convert to integer for numerical comparison
    });
};

module.exports = {
    initializeCronJobs,
    triggerChemoTerapyNotif,
    scheduleNotification,
    updateNotificationSchedule,
    sendNotification,
    stopScheduledJob
};