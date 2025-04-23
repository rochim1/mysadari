const {
  DataTypes
} = require('sequelize');
const sequelize = require('../config/database');
const User = require('./userModel');
const ChemoSchedule = require('./chemoSchModel');
const DrugConsumeTime = require('./drugConsumeTimeModel');

const NotificationSent = sequelize.define('notification_sents', {
  id_notification_sent: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  body: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  receiver: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id_user',
    },
    allowNull: false,
  },
  sender: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  tipe: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'deleted'),
    defaultValue: 'active',
    allowNull: true,
  },
  id_chemoSchedule: {
    type: DataTypes.UUID,
    references: {
      model: ChemoSchedule,
      key: 'id_chemoSchedule',
    },
    allowNull: true,
  },
  id_drug_consume_time: {
    type: DataTypes.UUID,
    references: {
      model: DrugConsumeTime,
      key: 'id_drug_consume_time',
    },
    allowNull: true,
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true
});

module.exports = NotificationSent;