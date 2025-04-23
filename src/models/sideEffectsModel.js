const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Side_effects = sequelize.define('side_effects', {
  id_side_effect: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  effect_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  effect_detail: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  // tableName: 'side_effects'
});

module.exports = Side_effects;
