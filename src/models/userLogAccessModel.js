const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./userModel');  // Import the User model

const user_log_access = sequelize.define('user_log_accesses', {
  id_log: {
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
  datetime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  access_via: {
    type: DataTypes.STRING,
    allowNull: true,
  },
},
{
  timestamps: true,
  // tableName: 'user_log_accesses'
});

module.exports = user_log_access;
