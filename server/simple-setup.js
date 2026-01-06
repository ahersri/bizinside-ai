const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  console.log('🚀 Setting up MySQL database...');
  
  // Create connection without database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  try {
    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'bizinside_db'}`);
    console.log('✅ Database created/verified');
    
    // Use the database
    await connection.query(`USE ${process.env.DB_NAME || 'bizinside_db'}`);
    
    // Create businesses table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS businesses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_name VARCHAR(255) NOT NULL,
        business_email VARCHAR(255) UNIQUE NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        business_type VARCHAR(50),
        industry VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ businesses table created');
    
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'Viewer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ users table created');
    
    // Create products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        product_code VARCHAR(50) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        selling_price DECIMAL(15,2) DEFAULT 0,
        cost_price DECIMAL(15,2) DEFAULT 0,
        current_stock INT DEFAULT 0,
        min_stock_level INT DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ products table created');
    
    console.log('\n🎉 Database setup complete!');
    console.log('You can now run: npm run dev');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

setupDatabase();