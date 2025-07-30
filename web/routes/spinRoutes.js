// web/routes/spinRoutes.js
import express from 'express';
import { connectToDatabase } from '../database.js';
import Customer from '../models/Customer.js';
import SpinHistory from '../models/SpinHistory.js';
import Transaction from '../models/Transaction.js';
import SpinWheel from '../models/SpinWheel.js';

const router = express.Router();


// Get spin wheel configuration
router.get('/config', async (req, res) => {
  try {
    await connectToDatabase();
    
    const shopDomain = req.query.shop;
    
    if (!shopDomain) {
      return res.status(400).json({ error: 'Shop domain required' });
    }
    
    let spinWheel = await SpinWheel.findOne({ shopDomain });
    
    // Create default configuration if none exists
    if (!spinWheel) {
      const defaultRewards = [
        {
          id: 'points_50',
          type: 'points',
          value: 50,
          label: '50 Points',
          probability: 30,
          color: '#3b82f6',
          isActive: true
        },
        {
          id: 'points_100',
          type: 'points',
          value: 100,
          label: '100 Points',
          probability: 20,
          color: '#10b981',
          isActive: true
        },
        {
          id: 'discount_10',
          type: 'discount_percentage',
          value: 10,
          label: '10% Off',
          probability: 25,
          color: '#f59e0b',
          isActive: true
        },
        {
          id: 'discount_15',
          type: 'discount_percentage',
          value: 15,
          label: '15% Off',
          probability: 15,
          color: '#ef4444',
          isActive: true
        },
        {
          id: 'free_shipping',
          type: 'free_shipping',
          value: 1,
          label: 'Free Shipping',
          probability: 8,
          color: '#8b5cf6',
          isActive: true
        },
        {
          id: 'better_luck',
          type: 'points',
          value: 0,
          label: 'Better Luck Next Time',
          probability: 2,
          color: '#6b7280',
          isActive: true
        }
      ];

      spinWheel = new SpinWheel({
        shopDomain,
        rewards: defaultRewards,
        settings: {
          spinsPerDay: 1,
          minimumOrdersRequired: 0,
          isActive: true
        }
      });
      
      await spinWheel.save();
    }
    
    res.json({
      rewards: spinWheel.rewards,
      settings: spinWheel.settings
    });
    
  } catch (error) {
    console.error('❌ Error fetching spin wheel config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new reward
router.post('/config/reward', async (req, res) => {
  try {
    await connectToDatabase();
    
    const { shopDomain, type, value, label, probability, color } = req.body;
    
    if (!shopDomain || !type || value === undefined || !label || !probability) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    let spinWheel = await SpinWheel.findOne({ shopDomain });
    
    if (!spinWheel) {
      spinWheel = new SpinWheel({
        shopDomain,
        rewards: [],
        settings: { spinsPerDay: 1, minimumOrdersRequired: 0, isActive: true }
      });
    }
    
    const newReward = {
      id: `${type}_${Date.now()}`,
      type,
      value: parseFloat(value),
      label,
      probability: parseFloat(probability),
      color: color || '#3b82f6',
      isActive: true
    };
    
    spinWheel.rewards.push(newReward);
    await spinWheel.save();
    
    res.json({ success: true, reward: newReward });
    
  } catch (error) {
    console.error('❌ Error adding reward:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update reward
router.put('/config/reward/:rewardId', async (req, res) => {
  try {
    await connectToDatabase();
    
    const { rewardId } = req.params;
    const { shopDomain, type, value, label, probability, color } = req.body;
    
    const spinWheel = await SpinWheel.findOne({ shopDomain });
    
    if (!spinWheel) {
      return res.status(404).json({ error: 'Spin wheel configuration not found' });
    }
    
    const rewardIndex = spinWheel.rewards.findIndex(r => r.id === rewardId);
    
    if (rewardIndex === -1) {
      return res.status(404).json({ error: 'Reward not found' });
    }
    
    spinWheel.rewards[rewardIndex] = {
      ...spinWheel.rewards[rewardIndex],
      type,
      value: parseFloat(value),
      label,
      probability: parseFloat(probability),
      color: color || spinWheel.rewards[rewardIndex].color
    };
    
    await spinWheel.save();
    
    res.json({ success: true, reward: spinWheel.rewards[rewardIndex] });
    
  } catch (error) {
    console.error('❌ Error updating reward:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete reward
router.delete('/config/reward/:rewardId', async (req, res) => {
  try {
    await connectToDatabase();
    
    const { rewardId } = req.params;
    const shopDomain = req.query.shop;
    
    const spinWheel = await SpinWheel.findOne({ shopDomain });
    
    if (!spinWheel) {
      return res.status(404).json({ error: 'Spin wheel configuration not found' });
    }
    
    spinWheel.rewards = spinWheel.rewards.filter(r => r.id !== rewardId);
    await spinWheel.save();
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error deleting reward:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;