FROM node:20.10.0-alpine

ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY

# Expose port 3000
EXPOSE 3000

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# Install only web dependencies (skip root)
WORKDIR /app/web
RUN npm install --production

# Install and build frontend
WORKDIR /app/web/frontend
RUN npm install
RUN npm run build

# Start from web directory
WORKDIR /app/web
CMD ["npm", "run", "serve"]