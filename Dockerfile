FROM node:18-alpine

ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY

# Expose port 3000
EXPOSE 3000

# Set working directory
WORKDIR /app

# Copy the entire project first
COPY . .

# Install root dependencies (if package.json exists in root)
RUN npm install || echo "No root package.json found"

# Install web (backend) dependencies
WORKDIR /app/web
RUN npm install

# Install frontend dependencies and build
WORKDIR /app/web/frontend
RUN npm install
RUN npm run build

# Go back to web directory for starting the app
WORKDIR /app/web

# Use the existing 'serve' script for production
CMD ["npm", "run", "serve"]