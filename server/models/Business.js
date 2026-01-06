const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Business = sequelize.define('Business', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    business_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    business_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    phone: DataTypes.STRING(20),
    mobile: DataTypes.STRING(20),
    business_type: DataTypes.STRING(50),
    industry: DataTypes.STRING(100),
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'businesses',
    timestamps: false
  });

  // Simplified association
  Business.associate = function(models) {
    // Will be set up after all models are loaded
  };

  return Business;
};