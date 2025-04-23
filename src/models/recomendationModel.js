const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Educations = require('./educationModel');
const SideEffects = require('./sideEffectsModel');

const Recomendation = sequelize.define('recomendations', {
  id_rekomendasi: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  id_side_effect: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: SideEffects,  // This should match the table name
      key: 'id_side_effect',
    },
  },
  id_education: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Educations,  // This should match the table name
      key: 'id_education',
    },
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
}, {
  timestamps: true,
  // tableName: 'recomendations'
});

module.exports = Recomendation;
