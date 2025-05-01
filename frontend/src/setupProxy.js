const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config({ path: '../.env' }); // Load .env from frontend root

const target = process.env.REACT_APP_API_URL || 'http://localhost:5000'; // Default fallback

module.exports = function(app) {
  app.use(
    '/api', // Proxy requests starting with /api
    createProxyMiddleware({
      target: target,
      changeOrigin: true,
    })
  );
};

