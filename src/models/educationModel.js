const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Educations = sequelize.define('educations', {
  id_education: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  video_link: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  thumbnail: {
    type: DataTypes.STRING(150),
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
}, {
  timestamps: true,
  // tableName: 'educations'
});

module.exports = Educations;
