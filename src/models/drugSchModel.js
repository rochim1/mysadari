const {
  DataTypes
} = require('sequelize');
const sequelize = require('../config/database');
const User = require('./userModel');  // Import the User model

const DrugSchedule = sequelize.define('drug_schedules', {
  id_drug_schedule: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  drug_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  dose: {
    type: DataTypes.TINYINT(2),
    allowNull: false,
  },
  drug_unit: {
    type: DataTypes.ENUM('Pil',
      'Tablet',
      'Tetes',
      'Kaplet',
      'Kapsul',
      'Semprotan (spray)',
      'Supositoria',
      'Sirup',
      'Salep',
      'Krim',
      'Gel',
      'Serbuk',
      'Injeksi (suntikan)',
      'Infus',
      'Inhaler',
      'Patch (plester)',
      'Larutan',
      'Suspensi',
      'Emulsi',
      'Granul',
      'Obat kumur'),
    defaultValue: 'pil',
    allowNull: true,
  },
  periode: {
    type: DataTypes.ENUM('setiap_hari', 'hari_pilihan', 'jangka_waktu'),
    defaultValue: 'setiap_hari',
    allowNull: true,
  },
  choosen_days: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  consume_per_day: {
    type: DataTypes.TINYINT(2),
    allowNull: true,
  },
  consume_regulation: {
    type: DataTypes.ENUM('sebelum_makan', 'sesudah_makan', 'saat_makan', 'saat_perut_kosong', 'sebelum tidur', 'setelah_bangun_tidur'),
    defaultValue: 'sebelum_makan',
    allowNull: true,
  },
  first_date_consume: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  long_consume: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  activate_notif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  note: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  consume_time: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  day_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_user: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: "id_user",
    },
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

module.exports = DrugSchedule;