const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./userModel");

const SessionLog = sequelize.define(
  "session_logs",
  {
    id_session: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_user: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id_user",
      },
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: true
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true, // Bisa kosong jika user belum logout
    },
  },
  {
    timestamps: true,
  }
);

module.exports = SessionLog;
