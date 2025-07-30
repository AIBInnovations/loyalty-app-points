// scripts/setup-database.js
require('dotenv').config();
const { connectDatabase } = require('../web/config/database.js');
const Shop = require('../web/models/Shop.js');
const Customer = require('../web/models/Customer.js');
const Transaction = require('../web/models/Transaction.js');
const SpinWheel = require('../web/models/SpinWheel.js');
const SpinHistory = require('../web/models/SpinHistory.js');

const setupDatabase = async () => {
  try {
    console.log('🔧 Setting up database...');
    
    await connectDatabase();
    
    // Create indexes
    console.log('📋 Creating indexes...');
    await Customer.createIndexes();
    await Transaction.createIndexes();
    await SpinHistory.createIndexes();
    await Shop.createIndexes();
    await SpinWheel.createIndexes();
    
    console.log('✅ Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

setupDatabase();

// scripts/seed-database.js
require('dotenv').config();
const { connectDatabase } = require('../web/config/database.js');
const SpinWheel = require('../web/models/SpinWheel.js');

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');
    
    await connectDatabase();
    
    // Create default spin wheel configuration
    const defaultSpinWheel = {
      shopDomain: 'example-shop.myshopify.com', // This will be updated per shop
      rewards: [
        {
          id: 'points_50',
          type: 'points',
          value: 50,
          label: '50 Points',
          probability: 30,
          color: '#3b82f6'
        },
        {
          id: 'points_100',
          type: 'points',
          value: 100,
          label: '100 Points',
          probability: 20,
          color: '#10b981'
        },
        {
          id: 'discount_10',
          type: 'discount_percentage',
          value: 10,
          label: '10% Off',
          probability: 25,
          color: '#f59e0b'
        },
        {
          id: 'discount_15',
          type: 'discount_percentage',
          value: 15,
          label: '15% Off',
          probability: 15,
          color: '#ef4444'
        },
        {
          id: 'free_shipping',
          type: 'free_shipping',
          value: 1,
          label: 'Free Shipping',
          probability: 8,
          color: '#8b5cf6'
        },
        {
          id: 'better_luck',
          type: 'points',
          value: 0,
          label: 'Better Luck Next Time',
          probability: 2,
          color: '#6b7280'
        }
      ],
      settings: {
        spinsPerDay: 1,
        minimumOrdersRequired: 0,
        isActive: true
      }
    };
    
    console.log('📊 Default spin wheel configuration created');
    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };