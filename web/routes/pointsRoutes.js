// web/routes/pointsRoutes.js
import express from 'express';
import { connectToDatabase } from '../database.js';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// Get customer points balance
router.get('/balance/:customerId', async (req, res) => {
  try {
    await connectToDatabase();
    
    const { customerId } = req.params;
    const shopDomain = req.query.shop;
    
    if (!shopDomain) {
      return res.status(400).json({ error: 'Shop domain required' });
    }
    
    const customer = await Customer.findOne({
      shopifyCustomerId: customerId,
      shopDomain
    });
    
    if (!customer) {
      return res.json({
        customerId,
        pointsBalance: 0,
        totalPointsEarned: 0,
        totalOrders: 0,
        isNew: true
      });
    }
    
    res.json({
      customerId: customer.shopifyCustomerId,
      pointsBalance: customer.pointsBalance,
      totalPointsEarned: customer.totalPointsEarned,
      totalPointsRedeemed: customer.totalPointsRedeemed,
      totalOrders: customer.totalOrders,
      lastSpinDate: customer.lastSpinDate,
      isNew: false
    });
    
  } catch (error) {
    console.error('❌ Error fetching customer balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer transaction history
router.get('/transactions/:customerId', async (req, res) => {
  try {
    await connectToDatabase();
    
    const { customerId } = req.params;
    const shopDomain = req.query.shop;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    if (!shopDomain) {
      return res.status(400).json({ error: 'Shop domain required' });
    }
    
    const transactions = await Transaction.find({
      shopifyCustomerId: customerId,
      shopDomain
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
    
    const total = await Transaction.countDocuments({
      shopifyCustomerId: customerId,
      shopDomain
    });
    
    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Redeem points (create discount code)
router.post('/redeem', async (req, res) => {
  try {
    await connectToDatabase();
    
    const { customerId, pointsToRedeem, shopDomain } = req.body;
    
    if (!customerId || !pointsToRedeem || !shopDomain) {
      return res.status(400).json({ 
        error: 'Customer ID, points to redeem, and shop domain required' 
      });
    }
    
    if (pointsToRedeem < 1) {
      return res.status(400).json({ error: 'Must redeem at least 1 point' });
    }
    
    const customer = await Customer.findOne({
      shopifyCustomerId: customerId,
      shopDomain
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    if (customer.pointsBalance < pointsToRedeem) {
      return res.status(400).json({ 
        error: 'Insufficient points balance',
        available: customer.pointsBalance,
        requested: pointsToRedeem
      });
    }
    
    // Calculate discount amount (1 point = 1 rupee by default)
    const pointsToRupeesRatio = parseInt(process.env.POINTS_TO_RUPEES_RATIO) || 1;
    const discountAmount = pointsToRedeem * pointsToRupeesRatio;
    
    // Generate unique discount code
    const discountCode = `LOYALTY${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Update customer balance
    customer.pointsBalance -= pointsToRedeem;
    customer.totalPointsRedeemed += pointsToRedeem;
    await customer.save();
    
    // Create transaction record
    const transaction = new Transaction({
      customerId: customer._id,
      shopifyCustomerId: customerId,
      shopDomain,
      type: 'redeemed',
      points: -pointsToRedeem,
      description: `Redeemed ${pointsToRedeem} points for ₹${discountAmount} discount`,
      discountCode,
      balanceAfter: customer.pointsBalance,
      metadata: {
        discountAmount,
        discountType: 'fixed_amount'
      }
    });
    
    await transaction.save();
    
    console.log(`💳 Customer ${customerId} redeemed ${pointsToRedeem} points`);
    
    res.json({
      success: true,
      discountCode,
      discountAmount,
      pointsRedeemed: pointsToRedeem,
      remainingBalance: customer.pointsBalance,
      message: `Successfully redeemed ${pointsToRedeem} points for ₹${discountAmount} discount`
    });
    
  } catch (error) {
    console.error('❌ Error processing points redemption:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all customers for admin dashboard
router.get('/customers', async (req, res) => {
  try {
    await connectToDatabase();
    
    const shopDomain = req.query.shop;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    if (!shopDomain) {
      return res.status(400).json({ error: 'Shop domain required' });
    }
    
    const customers = await Customer.find({ shopDomain })
      .sort({ totalPointsEarned: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Customer.countDocuments({ shopDomain });
    
    // Calculate summary stats
    const stats = await Customer.aggregate([
      { $match: { shopDomain } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalPointsIssued: { $sum: '$totalPointsEarned' },
          totalPointsRedeemed: { $sum: '$totalPointsRedeemed' },
          totalPointsOutstanding: { $sum: '$pointsBalance' }
        }
      }
    ]);
    
    res.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: stats[0] || {
        totalCustomers: 0,
        totalPointsIssued: 0,
        totalPointsRedeemed: 0,
        totalPointsOutstanding: 0
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    await connectToDatabase();
    
    const shopDomain = req.query.shop;
    const days = parseInt(req.query.days) || 30;
    
    if (!shopDomain) {
      return res.status(400).json({ error: 'Shop domain required' });
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Basic stats
    const totalCustomers = await Customer.countDocuments({ shopDomain });
    const totalPointsIssued = await Customer.aggregate([
      { $match: { shopDomain } },
      { $group: { _id: null, total: { $sum: '$totalPointsEarned' } } }
    ]);
    const totalPointsOutstanding = await Customer.aggregate([
      { $match: { shopDomain } },
      { $group: { _id: null, total: { $sum: '$pointsBalance' } } }
    ]);
    
    // Daily activity
    const dailyActivity = await Transaction.aggregate([
      {
        $match: {
          shopDomain,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          pointsEarned: {
            $sum: {
              $cond: [{ $gt: ['$points', 0] }, '$points', 0]
            }
          },
          pointsRedeemed: {
            $sum: {
              $cond: [{ $lt: ['$points', 0] }, { $abs: '$points' }, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          pointsEarned: 1,
          pointsRedeemed: 1,
          _id: 0
        }
      }
    ]);
    
    // Customer segments
    const customerSegments = await Customer.aggregate([
      { $match: { shopDomain } },
      {
        $bucket: {
          groupBy: '$pointsBalance',
          boundaries: [0, 100, 500, 1000, 5000],
          default: '5000+',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);
    
    const segmentLabels = ['0-99', '100-499', '500-999', '1000-4999', '5000+'];
    const formattedSegments = customerSegments.map((segment, index) => ({
      name: segmentLabels[index] || '5000+',
      count: segment.count,
      percentage: ((segment.count / totalCustomers) * 100).toFixed(1)
    }));
    
    // Redemption methods
    const redemptionMethods = await Transaction.aggregate([
      {
        $match: {
          shopDomain,
          type: 'redeemed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Top customers
    const topCustomers = await Customer.find({ shopDomain })
      .sort({ totalPointsEarned: -1 })
      .limit(10)
      .lean();
    
    const topCustomersWithNames = topCustomers.map(customer => ({
      ...customer,
      name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
    }));
    
    // Recent activity
    const recentActivity = await Transaction.find({ shopDomain })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('customerId', 'email firstName lastName')
      .lean();
    
    const formattedActivity = recentActivity.map(activity => ({
      ...activity,
      customerEmail: activity.customerId?.email || 'Unknown'
    }));
    
    // Calculate engagement rate
    const activeCustomers = await Customer.countDocuments({
      shopDomain,
      lastSpinDate: { $gte: startDate }
    });
    const engagementRate = totalCustomers > 0 ? ((activeCustomers / totalCustomers) * 100).toFixed(1) : 0;
    
    res.json({
      totalCustomers,
      totalPointsIssued: totalPointsIssued[0]?.total || 0,
      totalPointsOutstanding: totalPointsOutstanding[0]?.total || 0,
      totalValue: totalPointsOutstanding[0]?.total || 0, // Assuming 1:1 point to rupee ratio
      engagementRate,
      dailyActivity,
      customerSegments: formattedSegments,
      redemptionMethods: redemptionMethods.map(method => ({
        method: method._id,
        count: method.count
      })),
      topCustomers: topCustomersWithNames,
      recentActivity: formattedActivity
    });
    
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual points adjustment (admin only)
router.post('/adjust', async (req, res) => {
  try {
    await connectToDatabase();
    
    const { customerId, points, reason, shopDomain } = req.body;
    
    if (!customerId || points === undefined || !shopDomain) {
      return res.status(400).json({ 
        error: 'Customer ID, points adjustment, and shop domain required' 
      });
    }
    
    const customer = await Customer.findOne({
      shopifyCustomerId: customerId,
      shopDomain
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const oldBalance = customer.pointsBalance;
    const pointsChange = parseInt(points);
    
    // Prevent negative balance
    if (oldBalance + pointsChange < 0) {
      return res.status(400).json({ 
        error: 'Adjustment would result in negative balance',
        currentBalance: oldBalance,
        requestedChange: pointsChange
      });
    }
    
    // Update customer balance
    customer.pointsBalance += pointsChange;
    
    // Update totals appropriately
    if (pointsChange > 0) {
      customer.totalPointsEarned += pointsChange;
    }
    
    await customer.save();
    
    // Create transaction record
    const transaction = new Transaction({
      customerId: customer._id,
      shopifyCustomerId: customerId,
      shopDomain,
      type: 'adjustment',
      points: pointsChange,
      description: reason || `Admin adjustment: ${pointsChange > 0 ? 'added' : 'removed'} ${Math.abs(pointsChange)} points`,
      balanceAfter: customer.pointsBalance,
      metadata: {
        adjustmentType: 'manual',
        previousBalance: oldBalance
      }
    });
    
    await transaction.save();
    
    console.log(`🔧 Admin adjusted ${pointsChange} points for customer ${customerId}`);
    
    res.json({
      success: true,
      customerId,
      pointsAdjusted: pointsChange,
      previousBalance: oldBalance,
      newBalance: customer.pointsBalance,
      message: `Successfully ${pointsChange > 0 ? 'added' : 'removed'} ${Math.abs(pointsChange)} points`
    });
    
  } catch (error) {
    console.error('❌ Error adjusting points:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all transactions for admin (with filters)
router.get('/transactions/all', async (req, res) => {
  try {
    await connectToDatabase();
    
    const shopDomain = req.query.shop;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;
    
    if (!shopDomain) {
      return res.status(400).json({ error: 'Shop domain required' });
    }
    
    // Build filter query
    let matchQuery = { shopDomain };
    
    if (req.query.type) {
      matchQuery.type = req.query.type;
    }
    
    if (req.query.dateRange) {
      const days = parseInt(req.query.dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      matchQuery.createdAt = { $gte: startDate };
    }
    
    if (req.query.minPoints || req.query.maxPoints) {
      matchQuery.points = {};
      if (req.query.minPoints) matchQuery.points.$gte = parseInt(req.query.minPoints);
      if (req.query.maxPoints) matchQuery.points.$lte = parseInt(req.query.maxPoints);
    }
    
    // Add customer email search
    let pipeline = [
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $addFields: {
          customerEmail: { $arrayElemAt: ['$customer.email', 0] }
        }
      },
      { $match: matchQuery }
    ];
    
    if (req.query.customer) {
      pipeline.push({
        $match: {
          customerEmail: { $regex: req.query.customer, $options: 'i' }
        }
      });
    }
    
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    );
    
    const transactions = await Transaction.aggregate(pipeline);
    
    // Get total count for pagination
    const totalPipeline = [...pipeline.slice(0, -2)]; // Remove skip and limit
    totalPipeline.push({ $count: 'total' });
    const totalResult = await Transaction.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;
    
    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching all transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export transactions to CSV
router.get('/transactions/export', async (req, res) => {
  try {
    await connectToDatabase();
    
    const shopDomain = req.query.shop;
    
    if (!shopDomain) {
      return res.status(400).json({ error: 'Shop domain required' });
    }
    
    // Build filter query (same as above)
    let matchQuery = { shopDomain };
    
    if (req.query.type) {
      matchQuery.type = req.query.type;
    }
    
    if (req.query.dateRange) {
      const days = parseInt(req.query.dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      matchQuery.createdAt = { $gte: startDate };
    }
    
    const pipeline = [
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $addFields: {
          customerEmail: { $arrayElemAt: ['$customer.email', 0] },
          customerName: {
            $concat: [
              { $ifNull: [{ $arrayElemAt: ['$customer.firstName', 0] }, ''] },
              ' ',
              { $ifNull: [{ $arrayElemAt: ['$customer.lastName', 0] }, ''] }
            ]
          }
        }
      },
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      { $limit: 10000 } // Reasonable limit for export
    ];
    
    const transactions = await Transaction.aggregate(pipeline);
    
    // Convert to CSV
    const csvHeader = 'Date,Customer Email,Customer Name,Type,Description,Points,Balance After,Order ID,Discount Code\n';
    const csvRows = transactions.map(t => [
      new Date(t.createdAt).toISOString(),
      `"${t.customerEmail || ''}"`,
      `"${t.customerName?.trim() || ''}"`,
      t.type,
      `"${t.description}"`,
      t.points,
      t.balanceAfter,
      t.orderId || '',
      t.discountCode || ''
    ].join(',')).join('\n');
    
    const csv = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
    
  } catch (error) {
    console.error('❌ Error exporting transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;