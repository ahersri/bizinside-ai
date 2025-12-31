'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Business extends Model {
    static associate(models) {
      // Define associations here
      Business.hasMany(models.User, { foreignKey: 'business_id' });
      Business.hasMany(models.Product, { foreignKey: 'business_id' });
      Business.hasMany(models.Sale, { foreignKey: 'business_id' });
      Business.hasMany(models.Inventory, { foreignKey: 'business_id' });
    }
  }
  
  Business.init({
    business_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    business_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Small Business'
    },
    industry: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    business_email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    mobile: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'India'
    },
    pincode: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    tax_id: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    gst_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    registration_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    subscription_plan: {
      type: DataTypes.ENUM('free', 'basic', 'premium', 'enterprise'),
      defaultValue: 'free'
    },
    subscription_expiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Business',
    tableName: 'Businesses',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ['business_email']
      },
      {
        fields: ['business_name']
      },
      {
        fields: ['business_type']
      },
      {
        fields: ['industry']
      },
      {
        fields: ['city']
      },
      {
        fields: ['state']
      },
      {
        fields: ['status']
      }
    ]
  });
  
  return Business;
};