// web/models/Customer.js - ES Module version
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  shopifyCustomerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  shopDomain: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true
  },
  firstName: String,
  lastName: String,
  pointsBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPointsEarned: {
    type: Number,
    default: 0
  },
  totalPointsRedeemed: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  lastSpinDate: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for shop and customer
customerSchema.index({ shopDomain: 1, shopifyCustomerId: 1 });

export default mongoose.model('Customer', customerSchema);