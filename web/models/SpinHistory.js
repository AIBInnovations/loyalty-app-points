// web/models/SpinHistory.js
import mongoose from 'mongoose';

const spinHistorySchema = new mongoose.Schema({
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
  rewardWon: {
    type: {
      type: String,
      enum: ['points', 'discount_percentage', 'discount_fixed', 'free_shipping'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    label: {
      type: String,
      required: true
    }
  },
  discountCode: String,
  isRedeemed: {
    type: Boolean,
    default: false
  },
  redeemedAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

spinHistorySchema.index({ shopDomain: 1, shopifyCustomerId: 1, createdAt: -1 });

export default mongoose.model('SpinHistory', spinHistorySchema);