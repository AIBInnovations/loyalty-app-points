// web/webhooks/orderWebhooks.js
import crypto from 'crypto';
import { connectToDatabase } from '../database.js';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';

// Verify webhook authenticity
const verifyWebhook = (rawBody, signature, secret) => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody, 'utf8');
  const calculatedSignature = hmac.digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'base64'),
    Buffer.from(calculatedSignature, 'base64')
  );
};

// Award points for new order
export const handleOrderCreate = async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.get('X-Shopify-Hmac-Sha256');
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || 'webhook_secret';
    
    if (!verifyWebhook(req.rawBody, signature, webhookSecret)) {
      console.log('❌ Webhook verification failed');
      return res.status(401).send('Unauthorized');
    }

    await connectToDatabase();
    
    const order = req.body;
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    
    console.log(`📦 Processing order ${order.order_number} for ${shopDomain}`);
    
    // Skip if no customer (guest checkout)
    if (!order.customer) {
      console.log('ℹ️ Skipping guest order - no customer');
      return res.status(200).send('OK - Guest order');
    }
    
    const customerId = order.customer.id.toString();
    const pointsToAward = parseInt(process.env.POINTS_PER_ORDER) || 50;
    
    // Find or create customer
    let customer = await Customer.findOne({
      shopifyCustomerId: customerId,
      shopDomain
    });
    
    if (!customer) {
      customer = new Customer({
        shopifyCustomerId: customerId,
        shopDomain,
        email: order.customer.email,
        firstName: order.customer.first_name,
        lastName: order.customer.last_name,
        pointsBalance: 0,
        totalPointsEarned: 0,
        totalOrders: 0
      });
    }
    
    // Award points
    customer.pointsBalance += pointsToAward;
    customer.totalPointsEarned += pointsToAward;
    customer.totalOrders += 1;
    
    await customer.save();
    
    // Create transaction record
    const transaction = new Transaction({
      customerId: customer._id,
      shopifyCustomerId: customerId,
      shopDomain,
      type: 'earned',
      points: pointsToAward,
      description: `Earned ${pointsToAward} points for order #${order.order_number}`,
      orderId: order.id.toString(),
      orderNumber: order.order_number,
      balanceAfter: customer.pointsBalance,
      metadata: {
        orderTotal: order.total_price,
        orderCurrency: order.currency
      }
    });
    
    await transaction.save();
    
    console.log(`✅ Awarded ${pointsToAward} points to customer ${customerId}`);
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('❌ Error processing order webhook:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Handle order updates (in case of cancellations, etc.)
export const handleOrderUpdate = async (req, res) => {
  try {
    const signature = req.get('X-Shopify-Hmac-Sha256');
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || 'webhook_secret';
    
    if (!verifyWebhook(req.rawBody, signature, webhookSecret)) {
      return res.status(401).send('Unauthorized');
    }

    await connectToDatabase();
    
    const order = req.body;
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    
    console.log(`🔄 Processing order update ${order.order_number} for ${shopDomain}`);
    
    // Handle order cancellation - reverse points
    if (order.cancelled_at && order.customer) {
      const customerId = order.customer.id.toString();
      const pointsToReverse = parseInt(process.env.POINTS_PER_ORDER) || 50;
      
      const customer = await Customer.findOne({
        shopifyCustomerId: customerId,
        shopDomain
      });
      
      if (customer && customer.pointsBalance >= pointsToReverse) {
        customer.pointsBalance -= pointsToReverse;
        customer.totalOrders -= 1;
        await customer.save();
        
        // Create reversal transaction
        const transaction = new Transaction({
          customerId: customer._id,
          shopifyCustomerId: customerId,
          shopDomain,
          type: 'adjustment',
          points: -pointsToReverse,
          description: `Points reversed for cancelled order #${order.order_number}`,
          orderId: order.id.toString(),
          orderNumber: order.order_number,
          balanceAfter: customer.pointsBalance
        });
        
        await transaction.save();
        
        console.log(`↩️ Reversed ${pointsToReverse} points for cancelled order`);
      }
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('❌ Error processing order update webhook:', error);
    res.status(500).send('Internal Server Error');
  }
};