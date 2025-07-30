// web/database.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from parent directory
dotenv.config({ path: '../.env' });

console.log('🔍 MONGODB_URI:', process.env.MONGODB_URI);

let isConnected = false;

export const connectToDatabase = async () => {
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/loyalty-points-app';
    console.log('🔗 Connecting to:', mongoUri);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    console.log('✅ MongoDB Connected Successfully');
    
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