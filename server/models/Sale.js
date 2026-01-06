const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Sale = sequelize.define('Sale', {
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
    customer_name: DataTypes.STRING(255),
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    unit_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    total_amount: DataTypes.DECIMAL(15, 2),
    sale_date: DataTypes.DATE,
    payment_status: {
      type: DataTypes.ENUM('Pending', 'Paid', 'Partial'),
      defaultValue: 'Pending'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'sales',
    timestamps: false
  });

  Sale.associate = function(models) {
    // Will be set up after all models are loaded
  };

  return Sale;
};