const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./userModel');  
const Education = require('./educationModel');  

const EducationReadLog = sequelize.define('education_read_log', {
  id_read_log: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  id_user: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id_user',
    },
    allowNull: false,
  },
  id_education: {
    type: DataTypes.UUID,
    references: {
      model: Education,
      key: 'id_education',
    },
    allowNull: false,
  },
  read_at: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  read_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1, // Default pertama kali baca = 1
  }
}, {
  timestamps: true,
});

module.exports = EducationReadLog;
