'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('Users', {
      id_user: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING(25),
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      birthdate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(16),
        allowNull: true,
      },
      gender: {
        type: Sequelize.ENUM('m', 'f'),
        defaultValue: 'm',
        allowNull: true,
      },
      marriage_status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      last_education: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      stay_with: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      job: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      body_weight: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      body_height: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('Users');
  }
};