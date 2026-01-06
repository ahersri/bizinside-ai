const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_code: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    category: DataTypes.STRING(100),
    description: DataTypes.TEXT,
    unit: {
      type: DataTypes.STRING(20),
      defaultValue: 'PCS'
    },
    selling_price: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    cost_price: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    current_stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    min_stock_level: {
      type: DataTypes.INTEGER,
      defaultValue: 10
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
    tableName: 'products',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['business_id', 'product_code']
      }
    ]
  });

  Product.associate = function(models) {
    // Will be set up after all models are loaded
  };

  return Product;
};