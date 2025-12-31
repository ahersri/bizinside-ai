// server/models/Sale.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Sale extends Model {
    static associate(models) {
      Sale.belongsTo(models.Business, { foreignKey: 'business_id' });
      Sale.hasMany(models.SaleItem, { foreignKey: 'sale_id' });
    }
  }
  
  Sale.init({
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    invoice_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    customer_email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    customer_phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    sale_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'card', 'upi', 'bank_transfer', 'credit'),
      defaultValue: 'cash'
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'paid', 'partial', 'refunded'),
      defaultValue: 'pending'
    },
    status: {
      type: DataTypes.ENUM('draft', 'confirmed', 'cancelled', 'completed'),
      defaultValue: 'draft'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Sale',
    tableName: 'Sales',
    timestamps: true
  });
  
  return Sale;
};