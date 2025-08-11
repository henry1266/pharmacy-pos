import { createServer } from "http";
import { createApp, initializeDatabase } from "./app";

/**
 * @description 初始化並啟動HTTP伺服器
 * @async
 * @returns {Promise<Express.Application>} 啟動的Express應用程序實例
 */
async function startServer() {
  // 初始化資料庫
  await initializeDatabase();
  
  // 創建應用程序實例
  const app = createApp();
  
  const PORT: number = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT) :
                       process.env.PORT ? parseInt(process.env.PORT) : 5000;
  const HOST: string = process.env.SERVER_HOST || 'localhost';

  // 創建 HTTP 伺服器
  const server = createServer(app);

  server.listen(PORT, HOST, () => {
    console.log(`伺服器已啟動，監聽位址: ${HOST}:${PORT}`);
    console.log(`API 基礎 URL: http://${HOST}:${PORT}/api`);
  });

  // 優雅地處理伺服器關閉
  process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信號，正在關閉伺服器...');
    server.close(() => {
      console.log('伺服器已關閉');
      process.exit(0);
    });
  });

  return app;
}

// 只有在直接運行此檔案時才啟動伺服器
if (require.main === module) {
  startServer().catch(console.error);
}

/**
 * @description 為了向後兼容，導出應用程序創建函數
 * @type {Function} 創建Express應用程序的函數
 */
export default createApp;