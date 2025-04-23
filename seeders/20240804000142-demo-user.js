'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    return queryInterface.bulkInsert('Users', [
      {
        username: 'john_doe',
        email: 'john.doe@example.com',
        password: 'password123', // Normally you'd hash the password
        name: "john doe",
        birthdate: new Date('1999-06-02'),
        address: "las vegas, sleman, yogyakarta",
        phone: '+62 8215 000 65',
        gender: 'm',
        marriage_status: true,
        last_education: 'S1 - sistem informasi',
        stay_with: 'wife and childs',
        job: 'programmer',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

    return queryInterface.bulkDelete('Users', null, {});
  }
};
