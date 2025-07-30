// web/database.js - Database connection for existing Shopify app
import mongoose from 'mongoose';

let isConnected = false;

export const connectToDatabase = async () => {
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/loyalty-points-app';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    console.log('✅ MongoDB Connected Successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 MongoDB disconnected');
      isConnected = false;
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

export const checkDatabaseHealth = async () => {
  try {
    if (!isConnected) {
      await connectToDatabase();
    }
    
    await mongoose.connection.db.admin().ping();
    return { status: 'healthy', isConnected: true };
  } catch (error) {
    return { status: 'unhealthy', isConnected: false, error: error.message };
  }
};