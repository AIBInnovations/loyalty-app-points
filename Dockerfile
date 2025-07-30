FROM node:20.10.0-alpine

ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY

EXPOSE 3000
WORKDIR /app

# Copy only the web directory (backend)
COPY web ./web

# Install only the essential dependencies manually
WORKDIR /app/web
RUN npm init -y
RUN npm install express@4.18.2 mongoose@7.5.0 dotenv@16.3.1 cors@2.8.5
RUN npm install @shopify/shopify-app-express@5.0.8
RUN npm install cross-env@7.0.3

# Copy your source files
COPY web/index.js ./
COPY web/database.js ./
COPY web/gdpr.js ./
COPY web/shopify.js ./
COPY web/models ./models/
COPY web/routes ./routes/
COPY web/webhooks ./webhooks/

# Create a simple start script
RUN echo '{"scripts":{"serve":"cross-env NODE_ENV=production node index.js"}}' > package.json

CMD ["npm", "run", "serve"]