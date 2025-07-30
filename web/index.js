// web/index.js
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import GDPRWebhookHandlers from "./gdpr.js";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import spinRoutes from './routes/spinRoutes.js';


// Import database and routes
import { connectToDatabase, checkDatabaseHealth } from './database.js';
import pointsRoutes from './routes/pointsRoutes.js';
import { handleOrderCreate, handleOrderUpdate } from './webhooks/orderWebhooks.js';
import Shop from './models/Shop.js';

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10) || 3000;

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

app.use('/api/spin', spinRoutes);

// Middleware for raw body parsing (needed for webhook verification)
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// Middleware to capture raw body for webhook verification
app.use('/api/webhooks', (req, res, next) => {
  req.rawBody = req.body;
  next();
});

// Parse JSON for other routes
app.use('/api', express.json());

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.shopify.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.shopify.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      frameSrc: ["'self'", "https:"],
    },
  },
}));

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   message: "Too many requests from this IP, please try again later.",
// });
// // Also add this line before the rate limiter
// app.set('trust proxy', true);

// app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.HOST || 'http://localhost:3000',
  credentials: true
}));

// Initialize database connection
connectToDatabase().catch(console.error);

// Register webhooks when shop is authenticated
const registerWebhooks = async (shop, accessToken) => {
  try {
    const webhooks = [
      {
        topic: 'orders/create',
        address: `${process.env.HOST}/api/webhooks/orders/create`,
        format: 'json'
      },
      {
        topic: 'orders/updated',
        address: `${process.env.HOST}/api/webhooks/orders/update`, 
        format: 'json'
      }
    ];

    for (const webhook of webhooks) {
      try {
        const response = await fetch(`https://${shop}/admin/api/2024-10/webhooks.json`, {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ webhook })
        });

        if (response.ok) {
          console.log(`✅ Registered webhook: ${webhook.topic}`);
        } else {
          console.log(`⚠️ Webhook registration failed for ${webhook.topic}:`, await response.text());
        }
      } catch (err) {
        console.log(`❌ Error registering webhook ${webhook.topic}:`, err.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in webhook registration:', error);
  }
};

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  async (req, res, next) => {
    try {
      // Save shop information to database after successful OAuth
      const shop = res.locals.shopify.session.shop;
      const accessToken = res.locals.shopify.session.accessToken;
      
      await connectToDatabase();
      
      await Shop.findOneAndUpdate(
        { shopDomain: shop },
        {
          shopDomain: shop,
          accessToken: accessToken,
          shopifyShopId: res.locals.shopify.session.id,
          lastActiveAt: new Date()
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Shop ${shop} authenticated and saved to database`);
      
      // Register webhooks for this shop
      await registerWebhooks(shop, accessToken);
      
    } catch (error) {
      console.error('❌ Error saving shop to database:', error);
    }
    next();
  },
  shopify.redirectToShopifyOrAppRoot()
);

app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

// Health check endpoint with database status
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API Routes
app.use('/api/points', pointsRoutes);

// Webhook endpoints for order processing
app.post('/api/webhooks/orders/create', handleOrderCreate);
app.post('/api/webhooks/orders/update', handleOrderUpdate);

// Legacy API route placeholders (will be implemented in next phases)
app.use('/api/spin', express.json());   // Spin wheel routes
app.use('/api/customers', express.json()); // Customer management routes

// All subsequent routes require authentication
app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Admin UI: ${process.env.HOST}/admin`);
  console.log(`🏪 Shop: ${process.env.HOST}`);
});