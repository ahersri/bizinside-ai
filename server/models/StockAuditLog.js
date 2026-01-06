module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    'StockAuditLog',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      business_id: DataTypes.INTEGER,
      product_id: DataTypes.INTEGER,
      user_id: DataTypes.INTEGER,
      change_type: DataTypes.STRING, // ADJUST | UNDO
      quantity_before: DataTypes.INTEGER,
      quantity_after: DataTypes.INTEGER,
      reason: DataTypes.STRING,
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: 'stock_audit_logs',
      timestamps: false,
    }
  );
};
