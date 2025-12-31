const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Business Model
const Business = sequelize.define('Business', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  business_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  business_email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    validate: {
      len: [10, 15]
    }
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [10, 15]
    }
  },
  gst_number: {
    type: DataTypes.STRING(15),
    validate: {
      len: [15, 15]
    }
  },
  pan_number: {
    type: DataTypes.STRING(10),
    validate: {
      len: [10, 10]
    }
  },
  business_type: {
    type: DataTypes.ENUM('Startup', 'Small Business', 'MSME', 'Enterprise', 'Freelancer'),
    defaultValue: 'Small Business'
  },
  industry: {
    type: DataTypes.STRING,
    defaultValue: 'Manufacturing'
  },
  establishment_year: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1900,
      max: new Date().getFullYear()
    }
  },
  employee_count: {
    type: DataTypes.ENUM('1-5', '6-20', '21-100', '100+'),
    defaultValue: '1-5'
  },
  country: {
    type: DataTypes.STRING,
    defaultValue: 'India'
  },
  state: DataTypes.STRING,
  city: DataTypes.STRING,
  pincode: DataTypes.STRING,
  address: DataTypes.TEXT,
  is_multi_location: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  dashboard_config: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  data_source_config: {
    type: DataTypes.JSON,
    defaultValue: {
      manual_entry: true,
      excel_upload: false,
      auto_sync: false
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mobile: DataTypes.STRING,
  designation: DataTypes.STRING,
  role: {
    type: DataTypes.ENUM('Owner', 'Admin', 'Manager', 'Accountant', 'Analyst', 'Operator', 'Viewer'),
    defaultValue: 'Owner'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_login: DataTypes.DATE,
  dashboard_preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      view: 'simple',
      charts: ['bar', 'line'],
      modules: ['production', 'sales', 'inventory']
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Product Model
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_code: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  product_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  category: DataTypes.STRING,
  description: DataTypes.TEXT,
  unit: {
    type: DataTypes.STRING,
    defaultValue: 'PCS'
  },
  raw_material_cost: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  labor_cost: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  overhead_cost: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  total_cost: {
    type: DataTypes.VIRTUAL,
    get() {
      return (
        parseFloat(this.raw_material_cost) +
        parseFloat(this.labor_cost) +
        parseFloat(this.overhead_cost)
      );
    }
  },
  selling_price: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  margin: {
    type: DataTypes.VIRTUAL,
    get() {
      if (this.selling_price > 0) {
        return ((this.selling_price - this.total_cost) / this.selling_price * 100).toFixed(2);
      }
      return 0;
    }
  },
  min_stock_level: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    validate: {
      min: 0
    }
  },
  current_stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  image_url: DataTypes.STRING
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['business_id', 'product_code']
    }
  ]
});

// Production Model
const Production = sequelize.define('Production', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  production_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  shift: {
    type: DataTypes.ENUM('Morning', 'Evening', 'Night', 'General'),
    defaultValue: 'General'
  },
  planned_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  actual_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  good_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  rejected_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  machine_id: DataTypes.STRING,
  notes: DataTypes.TEXT,
  efficiency: {
    type: DataTypes.VIRTUAL,
    get() {
      if (this.planned_quantity > 0) {
        return ((this.actual_quantity / this.planned_quantity) * 100).toFixed(2);
      }
      return 0;
    }
  },
  rejection_rate: {
    type: DataTypes.VIRTUAL,
    get() {
      if (this.actual_quantity > 0) {
        return ((this.rejected_quantity / this.actual_quantity) * 100).toFixed(2);
      }
      return 0;
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['business_id', 'production_date']
    },
    {
      fields: ['product_id']
    }
  ]
});

// Sales Model
const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoice_number: {
    type: DataTypes.STRING,
    unique: true
  },
  customer_name: DataTypes.STRING,
  sale_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  unit_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  total_amount: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.quantity * this.unit_price;
    }
  },
  gst_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  gst_amount: {
    type: DataTypes.VIRTUAL,
    get() {
      return (this.quantity * this.unit_price * this.gst_percentage) / 100;
    }
  },
  net_amount: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.total_amount + this.gst_amount;
    }
  },
  payment_status: {
    type: DataTypes.ENUM('Paid', 'Pending', 'Partial'),
    defaultValue: 'Pending'
  },
  payment_date: DataTypes.DATE,
  notes: DataTypes.TEXT
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['business_id', 'sale_date']
    },
    {
      fields: ['invoice_number']
    },
    {
      fields: ['customer_name']
    }
  ]
});

// Inventory Transaction Model
const InventoryTransaction = sequelize.define('InventoryTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  transaction_type: {
    type: DataTypes.ENUM('Purchase', 'Sale', 'Return', 'Adjustment', 'Wastage', 'Production'),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notZero: true
    }
  },
  unit_price: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  total_value: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  reference_id: DataTypes.STRING,
  notes: DataTypes.TEXT,
  transaction_date: {
    type: DataTypes.DATEONLY,
    defaultValue: Sequelize.NOW
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// AI Insights Model
const AIInsight = sequelize.define('AIInsight', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  insight_type: {
    type: DataTypes.ENUM('Profit Analysis', 'Cost Analysis', 'Sales Trend', 'Production Issue', 'Inventory Alert', 'Custom'),
    defaultValue: 'Custom'
  },
  question: DataTypes.TEXT,
  insight_data: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  suggested_actions: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  confidence_score: {
    type: DataTypes.DECIMAL(5, 2),
    validate: {
      min: 0,
      max: 100
    }
  },
  is_resolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// File Upload Model
const FileUpload = sequelize.define('FileUpload', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_type: DataTypes.STRING,
  module: DataTypes.STRING,
  row_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('Processing', 'Completed', 'Failed'),
    defaultValue: 'Processing'
  },
  error_message: DataTypes.TEXT,
  uploaded_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  timestamps: false
});

// Define relationships
Business.hasMany(User, { foreignKey: 'business_id', onDelete: 'CASCADE' });
User.belongsTo(Business, { foreignKey: 'business_id' });

Business.hasMany(Product, { foreignKey: 'business_id', onDelete: 'CASCADE' });
Product.belongsTo(Business, { foreignKey: 'business_id' });

Business.hasMany(Production, { foreignKey: 'business_id', onDelete: 'CASCADE' });
Production.belongsTo(Business, { foreignKey: 'business_id' });

Business.hasMany(Sale, { foreignKey: 'business_id', onDelete: 'CASCADE' });
Sale.belongsTo(Business, { foreignKey: 'business_id' });

Business.hasMany(InventoryTransaction, { foreignKey: 'business_id', onDelete: 'CASCADE' });
InventoryTransaction.belongsTo(Business, { foreignKey: 'business_id' });

Business.hasMany(AIInsight, { foreignKey: 'business_id', onDelete: 'CASCADE' });
AIInsight.belongsTo(Business, { foreignKey: 'business_id' });

Business.hasMany(FileUpload, { foreignKey: 'business_id', onDelete: 'CASCADE' });
FileUpload.belongsTo(Business, { foreignKey: 'business_id' });

Product.hasMany(Production, { foreignKey: 'product_id', onDelete: 'CASCADE' });
Production.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(Sale, { foreignKey: 'product_id', onDelete: 'CASCADE' });
Sale.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(InventoryTransaction, { foreignKey: 'product_id', onDelete: 'CASCADE' });
InventoryTransaction.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(Production, { foreignKey: 'operator_id' });
Production.belongsTo(User, { foreignKey: 'operator_id', as: 'Operator' });

User.hasMany(FileUpload, { foreignKey: 'user_id' });
FileUpload.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(AIInsight, { foreignKey: 'user_id' });
AIInsight.belongsTo(User, { foreignKey: 'user_id' });

// Sync database (creates tables if they don't exist)
// sequelize.sync({ alter: true })
 // .then(() => {
  //  console.log('✅ All database tables synced successfully');
  //  console.log('📊 Tables created:');
  //  console.log('   - Businesses');
  //  console.log('   - Users');
  //  console.log('   - Products');
  //  console.log('   - Productions');
  //  console.log('   - Sales');
   // console.log('   - InventoryTransactions');
   // console.log('   - AIInsights');
   // console.log('   - FileUploads');
 // })
 // .catch(err => {
  //  console.error('❌ Database sync error:', err);
    //process.exit(1);
 // });

module.exports = {
  sequelize,
  Business,
  User,
  Product,
  Production,
  Sale,
  InventoryTransaction,
  AIInsight,
  FileUpload
};