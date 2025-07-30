// web/gdpr.js - Replace content with:
const GDPRWebhookHandlers = {
  CUSTOMERS_DATA_REQUEST: {
    deliveryMethod: "http",
    callbackUrl: "/api/webhooks/customers/data_request",
  },
  CUSTOMERS_REDACT: {
    deliveryMethod: "http", 
    callbackUrl: "/api/webhooks/customers/redact",
  },
  SHOP_REDACT: {
    deliveryMethod: "http",
    callbackUrl: "/api/webhooks/shop/redact", 
  },
};

export default GDPRWebhookHandlers;