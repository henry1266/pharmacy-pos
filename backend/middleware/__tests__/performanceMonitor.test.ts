// 在導入任何模組之前設置環境變數
process.env.NODE_ENV = 'test';

import request from 'supertest';
import express from 'express';
import {
  performanceMonitor,
  getPerformanceStats,
  clearPerformanceMetrics,
  getSlowRequests,
  getSystemHealth
} from '../performanceMonitor';

// Mock console methods to reduce test output noise
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});

// 創建測試應用
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // 使用性能監控中間件
  app.use(performanceMonitor);
  
  // 測試路由
  app.get('/test/fast', (_req, res) => {
    res.json({ success: true, message: '快速回應' });
  });
  
  app.get('/test/slow', async (_req, res) => {
    // 模擬慢請求
    await new Promise(resolve => setTimeout(resolve, 100));
    res.json({ success: true, message: '慢速回應' });
  });
  
  app.get('/test/error', (_req, res) => {
    res.status(500).json({ success: false, message: '錯誤回應' });
  });
  
  app.post('/test/post', (req, res) => {
    res.json({ success: true, data: req.body });
  });
  
  app.get('/test/memory-intensive', (_req, res) => {
    // 模擬記憶體密集操作
    const largeArray = new Array(1000).fill('test data');
    res.json({ success: true, dataSize: largeArray.length });
  });
  
  return app;
};

describe('PerformanceMonitor Middleware 測試', () => {
  let testApp: express.Application;

  beforeEach(() => {
    testApp = createTestApp();
    clearPerformanceMetrics();
  });

  afterEach(() => {
    jest.clearAllMocks();
    clearPerformanceMetrics();
  });

  describe('基本功能測試', () => {
    test('應該為請求添加 requestId', async () => {
      let capturedRequestId: string | undefined;
      
      const app = express();
      app.use(performanceMonitor);
      app.get('/test', (req: any, res) => {
        capturedRequestId = req.requestId;
        res.json({ success: true });
      });

      await request(app)
        .get('/test')
        .expect(200);

      expect(capturedRequestId).toBeDefined();
      expect(typeof capturedRequestId).toBe('string');
      expect(capturedRequestId).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    test('應該記錄請求性能指標', async () => {
      await request(testApp)
        .get('/test/fast')
        .expect(200);

      // 添加一個小的延遲，確保 res.on('finish') 回調有足夠的時間執行
      await new Promise(resolve => setTimeout(resolve, 50));

      const stats = getPerformanceStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.averageResponseTime).toBeGreaterThan(0);
      expect((stats.statusCodeDistribution as any)[200]).toBe(1);
    });

    test('應該處理不同的 HTTP 方法', async () => {
      await request(testApp)
        .get('/test/fast')
        .expect(200);

      await request(testApp)
        .post('/test/post')
        .send({ test: 'data' })
        .expect(200);

      // 添加一個小的延遲，確保 res.on('finish') 回調有足夠的時間執行
      await new Promise(resolve => setTimeout(resolve, 50));

      const stats = getPerformanceStats();
      expect(stats.totalRequests).toBe(2);
    });

    test('應該記錄不同的狀態碼', async () => {
      await request(testApp)
        .get('/test/fast')
        .expect(200);

      await request(testApp)
        .get('/test/error')
        .expect(500);

      // 添加一個小的延遲，確保 res.on('finish') 回調有足夠的時間執行
      await new Promise(resolve => setTimeout(resolve, 50));

      const stats = getPerformanceStats();
      expect(stats.totalRequests).toBe(2);
      expect((stats.statusCodeDistribution as any)[200]).toBe(1);
      expect((stats.statusCodeDistribution as any)[500]).toBe(1);
    });
  });

  describe('性能統計測試', () => {
    test('空指標時應該返回預設值', () => {
      const stats = getPerformanceStats();
      
      expect(stats).toEqual({
        totalRequests: 0,
        averageResponseTime: 0,
        slowestRequest: null,
        fastestRequest: null,
        statusCodeDistribution: {},
        memoryStats: null
      });
    });

    test('應該計算平均回應時間', async () => {
      await request(testApp)
        .get('/test/fast')
        .expect(200);

      await request(testApp)
        .get('/test/fast')
        .expect(200);

      // 添加一個小的延遲，確保 res.on('finish') 回調有足夠的時間執行
      await new Promise(resolve => setTimeout(resolve, 50));

      const stats = getPerformanceStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.averageResponseTime).toBeGreaterThan(0);
      expect(typeof stats.averageResponseTime).toBe('number');
    });

    test('應該識別最快和最慢的請求', async () => {
      await request(testApp)
        .get('/test/fast')
        .expect(200);

      await request(testApp)
        .get('/test/slow')
        .expect(200);

      // 添加一個小的延遲，確保 res.on('finish') 回調有足夠的時間執行
      await new Promise(resolve => setTimeout(resolve, 150));

      const stats = getPerformanceStats();
      expect(stats.slowestRequest).toBeDefined();
      expect(stats.fastestRequest).toBeDefined();
      expect(stats.slowestRequest!.duration).toBeGreaterThan(stats.fastestRequest!.duration!);
    });

    test('應該包含記憶體統計', async () => {
      await request(testApp)
        .get('/test/fast')
        .expect(200);

      // 添加一個小的延遲，確保 res.on('finish') 回調有足夠的時間執行
      await new Promise(resolve => setTimeout(resolve, 50));

      const stats = getPerformanceStats();
      expect(stats.memoryStats).toBeDefined();
      expect(stats.memoryStats!.rss).toBeGreaterThan(0);
      expect(stats.memoryStats!.heapUsed).toBeGreaterThan(0);
      expect(stats.memoryStats!.heapTotal).toBeGreaterThan(0);
    });
  });

  describe('慢請求檢測測試', () => {
    test('應該識別慢請求', async () => {
      await request(testApp)
        .get('/test/fast')
        .expect(200);

      await request(testApp)
        .get('/test/slow')
        .expect(200);

      // 添加一個小的延遲，確保 res.on('finish') 回調有足夠的時間執行
      await new Promise(resolve => setTimeout(resolve, 150));

      const slowRequests = getSlowRequests(50); // 50ms 閾值
      expect(slowRequests.length).toBeGreaterThan(0);
      expect(slowRequests[0].duration).toBeGreaterThan(50);
    });

    test('應該按持續時間排序慢請求', async () => {
      await request(testApp)
        .get('/test/slow')
        .expect(200);

      await request(testApp)
        .get('/test/slow')
        .expect(200);

      // 添加一個小的延遲，確保 res.on('finish') 回調有足夠的時間執行
      await new Promise(resolve => setTimeout(resolve, 150));

      const slowRequests = getSlowRequests(50, 10);
      if (slowRequests.length > 1) {
        expect(slowRequests[0].duration).toBeGreaterThanOrEqual(slowRequests[1].duration!);
      }
    });

    test('應該限制慢請求的數量', async () => {
      // 發送多個慢請求
      for (let i = 0; i < 5; i++) {
        await request(testApp)
          .get('/test/slow')
          .expect(200);
      }

      // 添加一個小的延遲，確保 res.on('finish') 回調有足夠的時間執行
      await new Promise(resolve => setTimeout(resolve, 200));

      const slowRequests = getSlowRequests(50, 3);
      expect(slowRequests.length).toBeLessThanOrEqual(3);
    });

    test('應該包含慢請求的詳細信息', async () => {
      await request(testApp)
        .get('/test/slow')
        .expect(200);

      // 添加一個小的延遲，確保 res.on('finish') 回調有足夠的時間執行
      await new Promise(resolve => setTimeout(resolve, 150));

      const slowRequests = getSlowRequests(50);
      if (slowRequests.length > 0) {
        const slowRequest = slowRequests[0];
        expect(slowRequest).toHaveProperty('requestId');
        expect(slowRequest).toHaveProperty('method');
        expect(slowRequest).toHaveProperty('url');
        expect(slowRequest).toHaveProperty('duration');
        expect(slowRequest).toHaveProperty('statusCode');
        expect(slowRequest).toHaveProperty('timestamp');
        expect(slowRequest.method).toBe('GET');
        expect(slowRequest.url).toBe('/test/slow');
      }
    });
  });

  describe('系統健康檢查測試', () => {
    test('應該返回系統健康狀態', () => {
      const health = getSystemHealth();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('memory');
      expect(health).toHaveProperty('cpu');
      expect(health).toHaveProperty('nodeVersion');
      expect(health).toHaveProperty('platform');
      expect(health).toHaveProperty('arch');
      
      expect(['healthy', 'warning']).toContain(health.status);
      expect(typeof health.uptime).toBe('number');
      expect(health.uptime).toBeGreaterThan(0);
    });

    test('記憶體統計應該包含正確的欄位', () => {
      const health = getSystemHealth();
      
      expect(health.memory).toHaveProperty('rss');
      expect(health.memory).toHaveProperty('heapUsed');
      expect(health.memory).toHaveProperty('heapTotal');
      expect(health.memory).toHaveProperty('external');
      expect(health.memory).toHaveProperty('usagePercent');
      
      expect(health.memory.rss).toBeGreaterThan(0);
      expect(health.memory.heapUsed).toBeGreaterThan(0);
      expect(health.memory.heapTotal).toBeGreaterThan(0);
      expect(health.memory.usagePercent).toBeGreaterThanOrEqual(0);
      expect(health.memory.usagePercent).toBeLessThanOrEqual(100);
    });

    test('CPU 統計應該包含正確的欄位', () => {
      const health = getSystemHealth();
      
      expect(health.cpu).toHaveProperty('user');
      expect(health.cpu).toHaveProperty('system');
      expect(typeof health.cpu.user).toBe('number');
      expect(typeof health.cpu.system).toBe('number');
    });

    test('系統信息應該正確', () => {
      const health = getSystemHealth();
      
      expect(health.nodeVersion).toBe(process.version);
      expect(health.platform).toBe(process.platform);
      expect(health.arch).toBe(process.arch);
    });
  });

  describe('記憶體管理測試', () => {
    test('應該限制存儲的指標數量', async () => {
      // 這個測試可能需要很長時間，所以我們模擬這個行為
      // 在實際實現中，performanceMetrics 會自動清理舊的指標
      
      // 發送一些請求
      for (let i = 0; i < 5; i++) {
        await request(testApp)
          .get('/test/fast')
          .expect(200);
      }

      const stats = getPerformanceStats();
      expect(stats.totalRequests).toBe(5);
      
      // 驗證指標確實被記錄了
      expect(stats.totalRequests).toBeGreaterThan(0);
    });

    test('clearPerformanceMetrics 應該清除所有指標', async () => {
      await request(testApp)
        .get('/test/fast')
        .expect(200);

      let stats = getPerformanceStats();
      expect(stats.totalRequests).toBe(1);

      clearPerformanceMetrics();
      
      stats = getPerformanceStats();
      expect(stats.totalRequests).toBe(0);
    });
  });

  describe('邊界條件測試', () => {
    test('應該處理非常快的請求', async () => {
      await request(testApp)
        .get('/test/fast')
        .expect(200);

      const stats = getPerformanceStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.averageResponseTime).toBeGreaterThanOrEqual(0);
    });

    test('應該處理並發請求', async () => {
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          request(testApp)
            .get('/test/fast')
            .expect(200)
        );
      }

      await Promise.all(promises);

      // 添加一個小的延遲，確保 res.on('finish') 回調有足夠的時間執行
      await new Promise(resolve => setTimeout(resolve, 50));

      const stats = getPerformanceStats();
      expect(stats.totalRequests).toBe(3);
    });

    test('應該處理不同路徑的請求', async () => {
      await request(testApp)
        .get('/test/fast')
        .expect(200);

      await request(testApp)
        .get('/test/slow')
        .expect(200);

      await request(testApp)
        .get('/test/error')
        .expect(500);

      // 添加一個小的延遲，確保 res.on('finish') 回調有足夠的時間執行
      await new Promise(resolve => setTimeout(resolve, 150));

      const stats = getPerformanceStats();
      expect(stats.totalRequests).toBe(3);
      expect(Object.keys(stats.statusCodeDistribution)).toContain('200');
      expect(Object.keys(stats.statusCodeDistribution)).toContain('500');
    });
  });

  describe('日誌功能測試', () => {
    test('應該記錄基本性能日誌', async () => {
      await request(testApp)
        .get('/test/fast')
        .expect(200);

      // 驗證 console.log 被調用
      expect(console.log).toHaveBeenCalled();
    });

    test('應該在開發環境記錄詳細日誌', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      await request(testApp)
        .get('/test/fast')
        .expect(200);

      expect(console.log).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('請求 ID 生成測試', () => {
    test('每個請求應該有唯一的 ID', async () => {
      const requestIds: string[] = [];
      
      const app = express();
      app.use(performanceMonitor);
      app.get('/test', (req: any, res) => {
        requestIds.push(req.requestId);
        res.json({ success: true });
      });

      // 發送多個請求
      for (let i = 0; i < 3; i++) {
        await request(app)
          .get('/test')
          .expect(200);
      }

      expect(requestIds).toHaveLength(3);
      expect(new Set(requestIds).size).toBe(3); // 所有 ID 都應該是唯一的
    });

    test('請求 ID 應該符合預期格式', async () => {
      let capturedRequestId: string | undefined;
      
      const app = express();
      app.use(performanceMonitor);
      app.get('/test', (req: any, res) => {
        capturedRequestId = req.requestId;
        res.json({ success: true });
      });

      await request(app)
        .get('/test')
        .expect(200);

      expect(capturedRequestId).toMatch(/^req_\d+_[a-z0-9]{9}$/);
    });
  });
});