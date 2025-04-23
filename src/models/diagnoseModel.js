const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./userModel');  // Import the User model

const Diagnose = sequelize.define('diagnoses', {
  id_diagnose: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  diagnose: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  stage: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  siklus: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  period: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  diagnose_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  kemo_start_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  responsible_doctor: {
    type: DataTypes.STRING(70),
    allowNull: true,
  },
  id_user: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id_user',
    },
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'deleted'),
    defaultValue: 'active',
    allowNull: true,
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  }
},
{
  timestamps: true,
  // tableName: 'diagnoses'
});

module.exports = Diagnose;
