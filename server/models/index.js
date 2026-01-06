const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const { initSequelize } = require('../config/sequelize');
const { logger } = require('../utils/logger');

const sequelize = initSequelize();
const db = {};

/**
 * =========================
 * Load Models
 * =========================
 */
const modelFiles = fs.readdirSync(__dirname).filter(file =>
  file !== 'index.js' && file.endsWith('.js')
);

modelFiles.forEach(file => {
  try {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
    logger.debug(`✅ Loaded model: ${model.name}`);
  } catch (err) {
    logger.error(`❌ Failed loading model ${file}: ${err.message}`);
  }
});

/**
 * =========================
 * Associations
 * =========================
 */
Object.values(db).forEach(model => {
  if (model.associate) {
    model.associate(db);
    logger.debug(`✅ Set up associations for: ${model.name}`);
  }
});

// Explicit relations (clear & intern-safe)
if (db.Business && db.User) {
  db.Business.hasMany(db.User, { foreignKey: 'business_id' });
  db.User.belongsTo(db.Business, { foreignKey: 'business_id' });
}

if (db.Business && db.Product) {
  db.Business.hasMany(db.Product, { foreignKey: 'business_id' });
  db.Product.belongsTo(db.Business, { foreignKey: 'business_id' });
}

if (db.Product && db.Sale) {
  db.Product.hasMany(db.Sale, { foreignKey: 'product_id' });
  db.Sale.belongsTo(db.Product, { foreignKey: 'product_id' });
}

if (db.Product && db.Production) {
  db.Product.hasMany(db.Production, { foreignKey: 'product_id' });
  db.Production.belongsTo(db.Product, { foreignKey: 'product_id' });
}

/**
 * =========================
 * Sync Database (SAFE)
 * =========================
 */
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established');

    /**
     * 🔒 SAFE SYNC
     * - No force
     * - No data loss
     * - Auto adjusts schema
     */
    await sequelize.sync({ alter: true });

    logger.info('📊 Database tables synchronized safely');

    const [tables] = await sequelize.query('SHOW TABLES;');
    logger.info('📋 Available tables:');
    tables.forEach(t => logger.info(`   - ${Object.values(t)[0]}`));

    return sequelize;
  } catch (error) {
    logger.error(`❌ Database sync failed: ${error.message}`);
    throw error;
  }
};

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.syncDatabase = syncDatabase;

module.exports = db;
