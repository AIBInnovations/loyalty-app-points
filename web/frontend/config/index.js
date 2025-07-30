// web/frontend/config/index.js
const config = {
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? '' // Relative URLs in production
    : 'http://localhost:3000', // Localhost in development
};

export default config;