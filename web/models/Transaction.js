// web/models/Transaction.js - ES Module version
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  shopifyCustomerId: {
    type: String,
    required: true,
    index: true
  },
  shopDomain: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['earned', 'redeemed', 'spin_reward', 'adjustment'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  orderId: String,
  orderNumber: String,
  discountCode: String,
  spinRewardType: String,
  balanceAfter: {
    type: Number,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

export default mongoose.model('Transaction', transactionSchema);