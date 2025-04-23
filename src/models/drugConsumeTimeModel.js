const {
  DataTypes
} = require('sequelize');
const sequelize = require('../config/database');
const User = require('./userModel');  // Import the User model
const drugSchModel = require('./drugSchModel');  // Import the User model

const drugConsumeTime = sequelize.define('drug_consume_time', {
  id_drug_consume_time: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  id_drug_schedule: {
    type: DataTypes.UUID,
    references: {
      model: drugSchModel,
      key: "id_drug_schedule",
    },
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  time: {
    type: DataTypes.STRING,
    allowNull: true
  },
  id_user: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: "id_user",
    },
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  is_consumed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'deleted'),
    defaultValue: 'active',
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  // tableName: 'drug_schedules'
});

module.exports = drugConsumeTime;