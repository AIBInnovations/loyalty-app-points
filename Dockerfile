FROM node:20.10.0-alpine

ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY

EXPOSE 3000
WORKDIR /app
COPY . .

# Use yarn to avoid npm dependency issues
RUN npm install -g yarn

# Install web dependencies with yarn
WORKDIR /app/web
RUN rm -f package-lock.json
RUN yarn install --production

# Make sure package.json has "type": "module"
RUN node -e "const pkg=require('./package.json'); pkg.type='module'; require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2))"

# Install and build frontend
WORKDIR /app/web/frontend
RUN rm -f package-lock.json
RUN yarn install
RUN yarn build

# Start from web directory
WORKDIR /app/web
CMD ["yarn", "serve"]