require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Business, User, Product } = require('../models');
const { logger } = require('../utils/logger');

async function seedDatabase() {
  try {
    // Create demo business
    const business = await Business.create({
      business_name: 'Demo Manufacturing Inc.',
      business_email: 'demo@manufacturing.com',
      mobile: '+919876543210',
      business_type: 'MSME',
      industry: 'Manufacturing',
      country: 'India',
      state: 'Maharashtra',
      city: 'Mumbai',
      address: '123 Industrial Area, Mumbai'
    });

    // Create demo owner
    const owner = await User.create({
      business_id: business.id,
      full_name: 'Demo Owner',
      email: 'owner@demo.com',
      password_hash: await bcrypt.hash('demopassword123', 10),
      mobile: '+919876543211',
      role: 'Owner',
      email_verified: true
    });

    // Create demo products
    const products = [
      {
        business_id: business.id,
        product_code: 'PROD-001',
        product_name: 'Steel Bolt 10mm',
        category: 'Fasteners',
        unit: 'PCS',
        raw_material_cost: 5.50,
        labor_cost: 2.00,
        overhead_cost: 1.50,
        selling_price: 12.00,
        min_stock_level: 100,
        current_stock: 500
      },
      {
        business_id: business.id,
        product_code: 'PROD-002',
        product_name: 'Aluminum Sheet 2mm',
        category: 'Raw Material',
        unit: 'KG',
        raw_material_cost: 250.00,
        labor_cost: 50.00,
        overhead_cost: 25.00,
        selling_price: 350.00,
        min_stock_level: 50,
        current_stock: 200
      }
    ];

    await Product.bulkCreate(products);

    logger.info('Demo data seeded successfully');
    logger.info(`Business: ${business.business_name}`);
    logger.info(`Owner email: ${owner.email} | Password: demopassword123`);
    logger.info(`Products created: ${products.length}`);

    process.exit(0);
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
}

seedDatabase();