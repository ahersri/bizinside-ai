const { Sequelize } = require('sequelize');
const { logger } = require('../utils/logger');

let sequelize;

const initSequelize = () => {
  if (!sequelize) {
    sequelize = new Sequelize(
      process.env.DB_NAME || 'bizinside_db',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? msg => logger.debug(msg) : false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        define: {
          timestamps: true,
          underscored: true
        },
        timezone: '+05:30' // IST
      }
    );
  }
  return sequelize;
};

module.exports = { initSequelize };