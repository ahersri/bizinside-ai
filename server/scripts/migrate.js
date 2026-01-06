require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');
const { logger } = require('../utils/logger');

const migrationsDir = path.join(__dirname, '../../database/migrations');

async function runMigrations() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected for migrations');

    // Read migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      logger.info(`Running migration: ${file}`);
      await sequelize.query(sql);
      logger.info(`Completed: ${file}`);
    }

    logger.info('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    process.exit(1);
  }
}

runMigrations();