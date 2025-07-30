// web/models/Shop.js - ES Module version
import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
  shopDomain: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  accessToken: {
    type: String,
    required: true
  },
  shopifyShopId: {
    type: String,
    required: true
  },
  name: String,
  email: String,
  currency: {
    type: String,
    default: 'INR'
  },
  timezone: String,
  settings: {
    pointsPerOrder: {
      type: Number,
      default: 50
    },
    pointsToRupeesRatio: {
      type: Number,
      default: 1
    },
    welcomePoints: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium'],
    default: 'free'
  },
  installedAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Shop', shopSchema);