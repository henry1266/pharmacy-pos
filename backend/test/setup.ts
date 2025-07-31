import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

// 在所有測試開始前設置
beforeAll(async () => {
  try {
    // 如果已經有連接，先關閉
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // 創建內存中的 MongoDB 實例
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    // 連接到測試資料庫，設置較短的超時時間
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 5000,
      waitQueueTimeoutMS: 5000
    });
  } catch (error) {
    console.error('測試資料庫設置失敗:', error);
    throw error;
  }
}, 60000);

// 在每個測試後清理
afterEach(async () => {
  try {
    // 只有在連接狀態正常時才清理
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    }
  } catch (error) {
    console.warn('清理測試數據時出錯:', error);
  }
});

// 在所有測試結束後清理
afterAll(async () => {
  try {
    // 檢查連接狀態
    if (mongoose.connection.readyState === 1) {
      // 先嘗試刪除資料庫
      try {
        await mongoose.connection.dropDatabase();
      } catch (error) {
        console.warn('刪除測試資料庫時出錯:', error);
      }
      
      // 關閉連接
      await mongoose.connection.close();
    }
    
    // 停止 MongoDB 實例
    if (mongod) {
      await mongod.stop();
    }
  } catch (error) {
    console.warn('清理測試環境時出錯:', error);
  }
}, 30000);

// 設置測試超時
jest.setTimeout(60000);

// 處理未捕獲的異常
process.on('unhandledRejection', (reason, promise) => {
  console.warn('未處理的 Promise 拒絕:', reason);
});

// 抑制 console.log 輸出（可選）
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: console.warn, // 保留警告以便調試
    error: console.error, // 保留錯誤以便調試
  };
}