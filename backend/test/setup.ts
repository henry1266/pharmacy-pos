import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// 全域測試設定
let mongoServer: MongoMemoryServer;

// 測試開始前的設定
beforeAll(async () => {
  // 建立記憶體中的 MongoDB 實例
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // 連接到測試資料庫
  await mongoose.connect(mongoUri);
});

// 每個測試後清理資料庫
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// 測試結束後的清理
afterAll(async () => {
  // 關閉資料庫連接
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // 停止記憶體中的 MongoDB 實例
  await mongoServer.stop();
});

// 全域測試工具函數
global.testUtils = {
  // 建立測試用戶
  createTestUser: async () => {
    const User = require('../models/User');
    return await User.create({
      username: 'testuser',
      password: 'testpassword',
      role: 'user',
      isActive: true
    });
  },

  // 建立測試管理員
  createTestAdmin: async () => {
    const User = require('../models/User');
    return await User.create({
      username: 'testadmin',
      password: 'testpassword',
      role: 'admin',
      isActive: true
    });
  },

  // 建立測試產品
  createTestProduct: async () => {
    const BaseProduct = require('../models/BaseProduct');
    const ProductCategory = require('../models/ProductCategory');
    
    const category = await ProductCategory.create({
      categoryCode: 'TEST001',
      name: '測試分類',
      isActive: true
    });

    return await BaseProduct.create({
      productCode: 'PROD001',
      productName: '測試產品',
      category: category._id,
      unit: '盒',
      isActive: true
    });
  },

  // 生成測試 JWT Token
  generateTestToken: (user: any) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        isAdmin: user.role === 'admin'
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },

  // 模擬認證請求
  mockAuthRequest: (user: any) => {
    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        isAdmin: user.role === 'admin'
      }
    };
  }
};

// 設定測試環境變數
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRE = '1h';

// 抑制 console.log 在測試中的輸出（可選）
if (process.env.SUPPRESS_TEST_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

// 擴展 Jest 匹配器
expect.extend({
  toBeValidObjectId(received) {
    const pass = mongoose.Types.ObjectId.isValid(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ObjectId`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ObjectId`,
        pass: false,
      };
    }
  },

  toHaveValidTimestamps(received) {
    const hasCreatedAt = received.createdAt && received.createdAt instanceof Date;
    const hasUpdatedAt = received.updatedAt && received.updatedAt instanceof Date;
    const pass = hasCreatedAt && hasUpdatedAt;
    
    if (pass) {
      return {
        message: () => `expected object not to have valid timestamps`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected object to have valid createdAt and updatedAt timestamps`,
        pass: false,
      };
    }
  }
});

// 型別聲明
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidObjectId(): R;
      toHaveValidTimestamps(): R;
    }
  }

  var testUtils: {
    createTestUser: () => Promise<any>;
    createTestAdmin: () => Promise<any>;
    createTestProduct: () => Promise<any>;
    generateTestToken: (user: any) => string;
    mockAuthRequest: (user: any) => any;
  };
}

export {};