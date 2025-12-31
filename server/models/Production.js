// server/models/Production.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Production extends Model {
    static associate(models) {
      Production.belongsTo(models.Business, { foreignKey: 'business_id' });
      Production.belongsTo(models.Product, { foreignKey: 'product_id' });
    }
  }
  
  Production.init({
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    batch_number: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    production_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    quantity_produced: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    unit_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    total_cost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('planned', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'planned'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Production',
    tableName: 'Productions',
    timestamps: true
  });
  
  return Production;
};