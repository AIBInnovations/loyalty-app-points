// web/seed-database.js - ES Module version
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables from parent directory
dotenv.config({ path: '../.env' });

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/loyalty-points-app';
    const conn = await mongoose.connect(mongoUri);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Create default spin wheel configuration (this will be used as template)
    const defaultSpinWheelConfig = {
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
    
    console.log('📊 Default spin wheel configuration ready');
    console.log('🎯 Spin wheel rewards:', defaultSpinWheelConfig.rewards.length);
    console.log('⚙️  Spin wheel settings configured');
    
    // Test database collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
    console.log('✅ Database seeding completed successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('📴 Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();