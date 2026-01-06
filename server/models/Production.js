const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Production = sequelize.define('Production', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    batch_number: DataTypes.STRING(100),
    production_date: DataTypes.DATE,
    quantity_produced: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    unit_cost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    total_cost: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('planned', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'planned'
    },
    notes: DataTypes.TEXT,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'productions',
    timestamps: false
  });

  Production.associate = function(models) {
    // Will be set up after all models are loaded
  };

  return Production;
};