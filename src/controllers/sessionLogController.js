const moment = require("moment");
const SessionLog = require("../models/sessionLogModel");
const { Op, Sequelize } = require("sequelize");
/**
 * Start a new session when user logs in
 */
const startSession = async (req, res) => {
    try {
        let { id_user } = req.body;

        if (!id_user) {
            id_user = req.user.id_user;
        }
        if (!id_user) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        // Buat sesi baru
        const session = await SessionLog.create({
            id_user,
            date: moment().format("YYYY-MM-DD"),
            start_time: moment().format("YYYY-MM-DD HH:mm:ss"),
        });

        return res.status(201).json({
            success: true,
            message: "Session started successfully",
            data: session,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * End a session when user logs out
 */
const endSession = async (req, res) => {
    try {
        const { id_session } = req.body;

        if (!id_session) {
            return res.status(400).json({
                success: false,
                message: "Session ID is required",
            });
        }

        // Cari sesi yang masih aktif
        const session = await SessionLog.findByPk(id_session);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }

        // Waktu sekarang sebagai end_time
        const endTime = moment();
        session.end_time = endTime.format("YYYY-MM-DD HH:mm:ss");

        // Hitung durasi dalam detik
        const startTime = moment(session.start_time);
        const duration = moment.duration(endTime.diff(startTime)).asSeconds();

        session.duration = duration; // Simpan durasi dalam database
        await session.save();

        return res.status(200).json({
            success: true,
            message: "Session ended successfully",
            data: {
                id_session: session.id_session,
                id_user: session.id_user,
                date: session.date,
                start_time: session.start_time,
                end_time: session.end_time,
                duration_seconds: duration,
                duration_human_readable: moment.utc(duration * 1000).format("HH:mm:ss"),
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Calculate total usage time in a day
 */
const getAllUsageSession = async (req, res) => {
    try {
        let { page = 1, pageSize = 10, filter = {} } = req.body;
        let { id_user, date } = filter;

        if (!id_user) {
            return res.status(400).json({
                success: false,
                message: "id_user perlu disertakan",
            });
        }

        // Pastikan page dan pageSize adalah angka valid
        page = parseInt(page) || 1;
        pageSize = parseInt(pageSize) || 10;

        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        // Filter kondisi
        let SessionWhereClause = { id_user };
        if (date) {
            SessionWhereClause.date = date;
        }

        // Query utama dengan agregasi
        const results = await SessionLog.findAll({
            attributes: [
                "date",
                "id_user",
                [Sequelize.fn("SUM", Sequelize.col("duration")), "totalSeconds"],
                [Sequelize.fn("COUNT", Sequelize.col("id_session")), "totalSessions"],
                [Sequelize.literal("SEC_TO_TIME(SUM(duration))"), "totalUsage"]
            ],
            where: SessionWhereClause,
            group: ["date", "id_user"],
            order: [["date", "DESC"]],
            offset,
            limit,
            raw: true
        });

        // Ambil detail sesi sekaligus
        const sessionDetails = await SessionLog.findAll({
            attributes: ["id_session", "date", "start_time", "end_time", "duration"],
            where: SessionWhereClause,
            order: [["date", "DESC"], ["start_time", "ASC"]],
            raw: true
        });

        // Gabungkan data berdasarkan tanggal
        const data = results.map(row => ({
            date: row.date,
            id_user: row.id_user,
            totalUsage: row.totalUsage, // Sudah dalam format HH:mm:ss dari MySQL
            totalSeconds: row.totalSeconds,
            totalSessions: row.totalSessions,
            sessions: sessionDetails.filter(s => s.date === row.date)
        }));

        // Hitung total durasi dan rata-rata secara keseluruhan
        // Ambil ringkasan total durasi dan jumlah sesi
        const usageSummary = await SessionLog.findAll({
            attributes: [
                "id_user",
                [Sequelize.literal("SEC_TO_TIME(SUM(duration))"), "totalDuration"], // Konversi langsung di SQL
                [Sequelize.fn("SUM", Sequelize.col("duration")), "totalSeconds"],
                [Sequelize.fn("COUNT", Sequelize.col("id_session")), "totalSessions"],
            ],
            where: SessionWhereClause,
            group: ["id_user"],
            raw: true
        });

        // Hitung total durasi dan rata-rata
        let totalDuration = usageSummary[0]?.totalDuration || "00:00:00";
        let totalSeconds = usageSummary.reduce((sum, row) => sum + parseInt(row.totalSeconds || 0, 10), 0);
        let totalSessions = usageSummary.reduce((sum, row) => sum + parseInt(row.totalSessions || 0, 10), 0);
        let averageDuration = totalSessions > 0 ? Math.floor(totalSeconds / totalSessions) : 0;

        // Konversi rata-rata durasi ke format HH:mm:ss jika ingin tetap menggunakan Moment.js
        // Konversi total durasi ke format HH:mm:ss atau Xd HH:mm:ss jika lebih dari 24 jam
        function formatDuration(seconds) {
            const days = Math.floor(seconds / 86400); // Hitung jumlah hari
            const timeString = moment.utc(seconds * 1000).format("HH:mm:ss");
            return days > 0 ? `${days}d ${timeString}` : timeString;
        }

        let totalDurationFormatted = formatDuration(totalSeconds);
        let averageDurationFormatted = formatDuration(averageDuration);

        return res.status(200).json({
            success: true,
            totalDurationFormatted, // Dari SQL
            totalSeconds,
            totalSessions,
            averageDuration,
            averageDurationFormatted,
            data,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};


const getOneUsageSession = async (req, res) => {
    try {
        let { id_user } = req.params;
        let { date } = req.body;

        if (!id_user) {
            id_user = req.user.id_user;
        }
        // Validasi input
        if (!id_user) {
            return res.status(400).json({
                success: false,
                message: "id_user is required",
            });
        }

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "date is required",
            });
        }

        // Ambil total durasi dan jumlah sesi untuk id_user tertentu pada tanggal tertentu
        const result = await SessionLog.findOne({
            attributes: [
                "date",
                "id_user",
                [Sequelize.fn("SUM", Sequelize.col("duration")), "totalSeconds"],
                [Sequelize.fn("COUNT", Sequelize.col("id_session")), "totalSessions"],
            ],
            where: {
                [Sequelize.Op.and]: [{ id_user }, { date }],
            },
            group: ["date", "id_user"],
            raw: true,
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "No session found for the given user and date",
            });
        }

        // Ambil detail semua sesi berdasarkan id_user dan tanggal tertentu
        const sessionDetails = await SessionLog.findAll({
            attributes: ["id_session", "date", "start_time", "end_time", "duration"],
            where: {
                [Sequelize.Op.and]: [{ id_user }, { date }],
            },
            order: [["start_time", "ASC"]],
            raw: true,
        });

        // Format response
        const data = {
            date: result.date,
            id_user: result.id_user,
            totalUsage: new Date(result.totalSeconds * 1000).toISOString().substr(11, 8), // Convert ke HH:mm:ss
            totalSeconds: result.totalSeconds,
            totalSessions: result.totalSessions,
            sessions: sessionDetails, // Detail sesi
        };

        return res.status(200).json({
            success: true,
            data,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

module.exports = { startSession, endSession, getAllUsageSession, getOneUsageSession };
