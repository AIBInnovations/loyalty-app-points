// web/models/SpinWheel.js
import mongoose from 'mongoose';

const spinWheelSchema = new mongoose.Schema({
  shopDomain: {
    type: String,
    required: true,
    index: true
  },
  rewards: [{
    id: {
      type: String,
      required: true
    },
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
    },
    probability: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    color: {
      type: String,
      default: '#3b82f6'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  settings: {
    spinsPerDay: {
      type: Number,
      default: 1
    },
    minimumOrdersRequired: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

export default mongoose.model('SpinWheel', spinWheelSchema);