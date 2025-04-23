require('dotenv').config();
const sequelize = require('./config/database');
const app = require('./app');

// prismaClient.js
// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

// module.exports = prisma;


const PORT = process.env.PORT || 3000;

sequelize.authenticate()
  .then(async () => {
    console.log('Database connected...');
    // if (process.env.environment == 'development' || process.env.environment !== 'production') {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
      const result =  await sequelize.sync({ force: false, alter: false, logging: false });  // Or the sync method you're using
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
      return result;
      // }
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Unable to connect to the database:', error);
  });
