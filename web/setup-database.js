// web/setup-database.js - ES Module version
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables from parent directory
dotenv.config({ path: '../.env' });

const setupDatabase = async () => {
  try {
    console.log('🔧 Setting up database...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/loyalty-points-app');
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/loyalty-points-app';
    const conn = await mongoose.connect(mongoUri, options);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.db.databaseName}`);
    console.log('✅ Database setup completed successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('📴 Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Make sure MongoDB is running or check your MONGODB_URI');
    }
    process.exit(1);
  }
};

setupDatabase();