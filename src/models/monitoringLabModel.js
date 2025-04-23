const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./userModel");

const monitoringLabModel = sequelize.define("monitoring_labs",
  {
    id_monitoring_lab: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_user: {
      type: DataTypes.UUID,
      references: {
        model: User,
        key: "id_user",
      },
      allowNull: false,
    },
    date_lab: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    body_weight: {
      type: DataTypes.FLOAT,  // Use FLOAT for numbers with decimals
      allowNull: true,
    },
    body_height: {
      type: DataTypes.FLOAT,  // Use FLOAT for numbers with decimals
      allowNull: true,
    },
    hemoglobin: {
      type: DataTypes.FLOAT,  // Use FLOAT for numbers with decimals
      allowNull: true,
    },
    leucocytes: {
      type: DataTypes.FLOAT,  // Use FLOAT for numbers with decimals
      allowNull: true,
    },
    platelets: {
      type: DataTypes.FLOAT,  // Use FLOAT for numbers with decimals
      allowNull: true,
    },
    neutrophyle: {
      type: DataTypes.FLOAT,  // Use FLOAT for numbers with decimals
      allowNull: true,
    },
    sgot: {
      type: DataTypes.FLOAT,  // Use FLOAT for numbers with decimals
      allowNull: true,
    },
    sgpt: {
      type: DataTypes.FLOAT,  // Use FLOAT for numbers with decimals
      allowNull: true,
    },
    bun: {
      type: DataTypes.FLOAT,  // Use FLOAT for numbers with decimals
      allowNull: true,
    },
    creatinine: {
      type: DataTypes.FLOAT,  // Use FLOAT for numbers with decimals
      allowNull: true,
    },
    glucose: {
      type: DataTypes.FLOAT,  // Use FLOAT for numbers with decimals
      allowNull: true,
    },
    amylase: {
      type: DataTypes.FLOAT,  // Use FLOAT for numbers with decimals
      allowNull: true,
    },
    Lipase: {
      type: DataTypes.FLOAT,  // Use FLOAT for numbers with decimals
      allowNull: true,
    },

    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "deleted"),
      defaultValue: "active",
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = monitoringLabModel;
