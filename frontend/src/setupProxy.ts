import { createProxyMiddleware } from 'http-proxy-middleware';
import { Express } from 'express';
import dotenv from 'dotenv';

// 使用 TypeScript 類型定義
dotenv.config({ path: '../.env' }); // Load .env from frontend root

const target = process.env.REACT_APP_API_URL || 'http://localhost:5000'; // Default fallback

// 添加 Express 類型
module.exports = function(app: Express) {
  app.use(
    '/api', // Proxy requests starting with /api
    createProxyMiddleware({
      target: target,
      changeOrigin: true,
    })
  );
};