FROM node:20.10.0-alpine

ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY

EXPOSE 3000
WORKDIR /app
COPY . .

WORKDIR /app/web
RUN npm install --production

WORKDIR /app/web/frontend
RUN npm install
RUN npm run build

WORKDIR /app/web
CMD ["npm", "run", "serve"]