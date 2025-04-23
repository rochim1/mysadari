const Educations = require('./educationModel');
const Recomendation = require('./recomendationModel');
const SideEffects = require('./sideEffectsModel');
const UserSideEffects = require("./userSideEffectsModel");
const DrugSchedule = require('./drugSchModel')
const DrugConsumeTime = require('./drugConsumeTimeModel')

const ChemoSchedule = require('./chemoSchModel')
const NotificationSent = require('./notificationSentModel');
const EducationReadLog = require('./educationReadLogModel');

// Define associations here
Educations.hasMany(Recomendation, {
  foreignKey: 'id_education',
  as: 'recomendations', // Association alias
});

Educations.hasMany(EducationReadLog, {
  foreignKey: 'id_education',
  as: 'readLog', // Association alias
});

Recomendation.belongsTo(Educations, {
  foreignKey: 'id_education',
  as: 'education', // Ensure consistency
});

EducationReadLog.belongsTo(Educations, {
  foreignKey: 'id_education',
  as: 'education', // Ensure consistency
});

Recomendation.belongsTo(SideEffects, {
  foreignKey: 'id_side_effect',
  as: 'sideEffect', // Use camelCase for clarity
});

UserSideEffects.belongsTo(SideEffects, {
  foreignKey: 'id_side_effect',
  as: 'sideEffect', // Use camelCase for clarity
});

SideEffects.hasMany(UserSideEffects, {
  foreignKey: 'id_side_effect',
  as: 'user_side_effects', // Association alias
});

SideEffects.hasMany(Recomendation, {
  foreignKey: 'id_side_effect',
  as: 'recomendations', // Association alias
});

// ========================================================================
DrugSchedule.hasMany(DrugConsumeTime, {
  foreignKey: 'id_drug_schedule',
  as: 'drug_consume_times',
  onDelete: 'CASCADE', // Optional: handle delete
});

DrugConsumeTime.belongsTo(DrugSchedule, {
  foreignKey: 'id_drug_schedule',
  as: 'drug_schedule',
  onDelete: 'NO ACTION', // Optional: handle delete
});


NotificationSent.belongsTo(ChemoSchedule, { foreignKey: 'id_chemoSchedule' });
NotificationSent.belongsTo(DrugConsumeTime, { foreignKey: 'id_drug_consume_time' });



// Ensure models are exported after associations are defined
module.exports = {
  Educations,
  Recomendation,
  UserSideEffects,
  SideEffects,
  DrugSchedule,
  DrugConsumeTime,
  NotificationSent,
  EducationReadLog
};
