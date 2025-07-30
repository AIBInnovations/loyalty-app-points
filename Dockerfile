FROM node:20.10.0-alpine

ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY

EXPOSE 3000
WORKDIR /app
COPY . .

# Clean install for web dependencies
WORKDIR /app/web
RUN npm ci --only=production

# Clean install for frontend
WORKDIR /app/web/frontend
RUN npm ci
RUN npm run build

WORKDIR /app/web
CMD ["npm", "run", "serve"]