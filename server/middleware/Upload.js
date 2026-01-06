const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/* BUSINESS */
const Business = sequelize.define(
  'Business',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    business_name: DataTypes.STRING,
    business_email: DataTypes.STRING,
  },
  {
    tableName: 'business',       // ✅ FIX
    freezeTableName: true,       // ✅ IMPORTANT
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

/* USER */
const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    business_id: DataTypes.INTEGER,
    full_name: DataTypes.STRING,
    email: DataTypes.STRING,
    password_hash: DataTypes.STRING,
    role: DataTypes.STRING,
    is_active: DataTypes.BOOLEAN,
  },
  {
    tableName: 'user',           // ✅ FIX
    freezeTableName: true,       // ✅ IMPORTANT
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

/* FILE UPLOAD */
const FileUpload = sequelize.define(
  'FileUpload',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    business_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    filename: DataTypes.STRING,
    file_type: DataTypes.STRING,
    module: DataTypes.STRING,
    status: DataTypes.STRING,
    error_message: DataTypes.TEXT,
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    tableName: 'fileuploads',    // ✅ FIX
    freezeTableName: true,       // ✅ IMPORTANT
    timestamps: false,
  }
);

/* RELATIONS */
Business.hasMany(User, { foreignKey: 'business_id' });
User.belongsTo(Business, { foreignKey: 'business_id' });

Business.hasMany(FileUpload, { foreignKey: 'business_id' });
FileUpload.belongsTo(Business, { foreignKey: 'business_id' });

User.hasMany(FileUpload, { foreignKey: 'user_id' });
FileUpload.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  Business,
  User,
  FileUpload,
};
