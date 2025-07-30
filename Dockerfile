FROM node:20.10.0-alpine

ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY

# Expose port 3000
EXPOSE 3000

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY web/package*.json ./web/

# Install dependencies
RUN npm install --production || echo "No root package.json"
WORKDIR /app/web
RUN npm install --production

# Copy application code
WORKDIR /app
COPY . .

# Build frontend
WORKDIR /app/web/frontend
RUN npm install
RUN npm run build

# Start from web directory
WORKDIR /app/web
CMD ["npm", "run", "serve"]