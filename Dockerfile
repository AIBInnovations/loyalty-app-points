FROM node:20.10.0-alpine

ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY

EXPOSE 3000
WORKDIR /app
COPY . .

# Install web dependencies
WORKDIR /app/web
RUN rm -f package-lock.json
RUN npm install --legacy-peer-deps --production

# Ensure package.json has "type": "module"
RUN node -e "const pkg=require('./package.json'); pkg.type='module'; require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2))"

# Install and build frontend
WORKDIR /app/web/frontend
RUN rm -f package-lock.json
RUN npm install --legacy-peer-deps
RUN npm run build

WORKDIR /app/web
CMD ["npm", "run", "serve"]