import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

// 在所有測試開始前設置
beforeAll(async () => {
  // 創建內存中的 MongoDB 實例
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  // 連接到測試資料庫
  await mongoose.connect(uri);
});

// 在每個測試後清理
afterEach(async () => {
  // 清除所有集合
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// 在所有測試結束後清理
afterAll(async () => {
  // 關閉資料庫連接
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // 停止 MongoDB 實例
  await mongod.stop();
});

// 設置測試超時
jest.setTimeout(30000);

// 抑制 console.log 輸出（可選）
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};