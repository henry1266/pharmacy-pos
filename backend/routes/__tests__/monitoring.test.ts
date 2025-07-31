import request from 'supertest';
import { createApp } from '../../app';
import mongoose from 'mongoose';

describe('Monitoring API', () => {
  let app: any;

  beforeAll(async () => {
    app = await createApp();
    
    // 設置測試模式環境變數
    process.env.REACT_APP_TEST_MODE = 'true';
  });

  afterAll(async () => {
    // 清理由 test/setup.ts 管理的連接
  });

  describe('GET /api/monitoring/health', () => {
    it('應該返回系統健康狀態', async () => {
      const response = await request(app)
        .get('/api/monitoring/health')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('environment');
    });

    it('應該包含資料庫連接狀態', async () => {
      const response = await request(app)
        .get('/api/monitoring/health')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('database');
      expect(response.body.data.database).toHaveProperty('status');
      expect(response.body.data.database).toHaveProperty('responseTime');
      expect(response.body.data.database.status).toBe('connected');
    });

    it('應該包含記憶體使用情況', async () => {
      const response = await request(app)
        .get('/api/monitoring/health')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('memory');
      expect(response.body.data.memory).toHaveProperty('used');
      expect(response.body.data.memory).toHaveProperty('total');
      expect(response.body.data.memory).toHaveProperty('percentage');
      expect(typeof response.body.data.memory.used).toBe('number');
      expect(typeof response.body.data.memory.total).toBe('number');
    });

    it('應該包含 CPU 使用情況', async () => {
      const response = await request(app)
        .get('/api/monitoring/health')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('cpu');
      expect(response.body.data.cpu).toHaveProperty('usage');
      expect(response.body.data.cpu).toHaveProperty('loadAverage');
      expect(typeof response.body.data.cpu.usage).toBe('number');
      expect(Array.isArray(response.body.data.cpu.loadAverage)).toBe(true);
    });
  });

  describe('GET /api/monitoring/metrics', () => {
    it('應該返回系統指標', async () => {
      const response = await request(app)
        .get('/api/monitoring/metrics')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('requests');
      expect(response.body.data).toHaveProperty('responses');
      expect(response.body.data).toHaveProperty('errors');
      expect(response.body.data).toHaveProperty('performance');
    });

    it('應該包含請求統計', async () => {
      const response = await request(app)
        .get('/api/monitoring/metrics')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const requests = response.body.data.requests;
      expect(requests).toHaveProperty('total');
      expect(requests).toHaveProperty('perSecond');
      expect(requests).toHaveProperty('perMinute');
      expect(requests).toHaveProperty('perHour');
      expect(typeof requests.total).toBe('number');
    });

    it('應該包含回應時間統計', async () => {
      const response = await request(app)
        .get('/api/monitoring/metrics')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const performance = response.body.data.performance;
      expect(performance).toHaveProperty('averageResponseTime');
      expect(performance).toHaveProperty('minResponseTime');
      expect(performance).toHaveProperty('maxResponseTime');
      expect(performance).toHaveProperty('p95ResponseTime');
      expect(performance).toHaveProperty('p99ResponseTime');
    });

    it('應該包含錯誤統計', async () => {
      const response = await request(app)
        .get('/api/monitoring/metrics')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const errors = response.body.data.errors;
      expect(errors).toHaveProperty('total');
      expect(errors).toHaveProperty('rate');
      expect(errors).toHaveProperty('byStatusCode');
      expect(typeof errors.total).toBe('number');
      expect(typeof errors.rate).toBe('number');
    });

    it('應該支援時間範圍篩選', async () => {
      const response = await request(app)
        .get('/api/monitoring/metrics?timeRange=1h')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('timeRange');
      expect(response.body.data.timeRange).toBe('1h');
    });
  });

  describe('GET /api/monitoring/logs', () => {
    it('應該返回系統日誌', async () => {
      const response = await request(app)
        .get('/api/monitoring/logs')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('timestamp');
        expect(response.body.data[0]).toHaveProperty('level');
        expect(response.body.data[0]).toHaveProperty('message');
        expect(response.body.data[0]).toHaveProperty('source');
      }
    });

    it('應該支援日誌等級篩選', async () => {
      const response = await request(app)
        .get('/api/monitoring/logs?level=error')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((log: any) => {
        expect(log.level).toBe('error');
      });
    });

    it('應該支援分頁', async () => {
      const response = await request(app)
        .get('/api/monitoring/logs?page=1&limit=10')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
      expect(response.body).toHaveProperty('pagination');
    });

    it('應該支援時間範圍篩選', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const response = await request(app)
        .get(`/api/monitoring/logs?startTime=${oneHourAgo.toISOString()}&endTime=${now.toISOString()}`)
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((log: any) => {
        const logTime = new Date(log.timestamp);
        expect(logTime.getTime()).toBeGreaterThanOrEqual(oneHourAgo.getTime());
        expect(logTime.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    it('應該支援關鍵字搜尋', async () => {
      const response = await request(app)
        .get('/api/monitoring/logs?search=error')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((log: any) => {
        expect(log.message.toLowerCase()).toContain('error');
      });
    });
  });

  describe('GET /api/monitoring/performance', () => {
    it('應該返回性能指標', async () => {
      const response = await request(app)
        .get('/api/monitoring/performance')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('endpoints');
      expect(response.body.data).toHaveProperty('database');
      expect(response.body.data).toHaveProperty('cache');
      expect(response.body.data).toHaveProperty('memory');
    });

    it('應該包含端點性能統計', async () => {
      const response = await request(app)
        .get('/api/monitoring/performance')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const endpoints = response.body.data.endpoints;
      expect(Array.isArray(endpoints)).toBe(true);
      
      if (endpoints.length > 0) {
        expect(endpoints[0]).toHaveProperty('path');
        expect(endpoints[0]).toHaveProperty('method');
        expect(endpoints[0]).toHaveProperty('averageResponseTime');
        expect(endpoints[0]).toHaveProperty('requestCount');
        expect(endpoints[0]).toHaveProperty('errorRate');
      }
    });

    it('應該包含資料庫性能統計', async () => {
      const response = await request(app)
        .get('/api/monitoring/performance')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const database = response.body.data.database;
      expect(database).toHaveProperty('connectionCount');
      expect(database).toHaveProperty('averageQueryTime');
      expect(database).toHaveProperty('slowQueries');
      expect(database).toHaveProperty('connectionPool');
    });

    it('應該包含快取性能統計', async () => {
      const response = await request(app)
        .get('/api/monitoring/performance')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const cache = response.body.data.cache;
      expect(cache).toHaveProperty('hitRate');
      expect(cache).toHaveProperty('missRate');
      expect(cache).toHaveProperty('totalRequests');
      expect(cache).toHaveProperty('memoryUsage');
    });
  });

  describe('GET /api/monitoring/alerts', () => {
    it('應該返回系統警報', async () => {
      const response = await request(app)
        .get('/api/monitoring/alerts')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('type');
        expect(response.body.data[0]).toHaveProperty('severity');
        expect(response.body.data[0]).toHaveProperty('message');
        expect(response.body.data[0]).toHaveProperty('timestamp');
        expect(response.body.data[0]).toHaveProperty('status');
      }
    });

    it('應該支援嚴重程度篩選', async () => {
      const response = await request(app)
        .get('/api/monitoring/alerts?severity=critical')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((alert: any) => {
        expect(alert.severity).toBe('critical');
      });
    });

    it('應該支援狀態篩選', async () => {
      const response = await request(app)
        .get('/api/monitoring/alerts?status=active')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((alert: any) => {
        expect(alert.status).toBe('active');
      });
    });

    it('應該支援類型篩選', async () => {
      const response = await request(app)
        .get('/api/monitoring/alerts?type=performance')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((alert: any) => {
        expect(alert.type).toBe('performance');
      });
    });
  });

  describe('POST /api/monitoring/alerts/:id/acknowledge', () => {
    it('應該確認警報', async () => {
      // 假設有一個警報 ID
      const alertId = new mongoose.Types.ObjectId().toString();
      
      const response = await request(app)
        .post(`/api/monitoring/alerts/${alertId}/acknowledge`)
        .set('Authorization', 'Bearer test-mode-token')
        .send({ acknowledgedBy: 'test-user', note: '已處理' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data.status).toBe('acknowledged');
    });

    it('應該處理不存在的警報', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      const response = await request(app)
        .post(`/api/monitoring/alerts/${fakeId}/acknowledge`)
        .set('Authorization', 'Bearer test-mode-token')
        .send({ acknowledgedBy: 'test-user' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/monitoring/system-info', () => {
    it('應該返回系統資訊', async () => {
      const response = await request(app)
        .get('/api/monitoring/system-info')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('os');
      expect(response.body.data).toHaveProperty('node');
      expect(response.body.data).toHaveProperty('application');
      expect(response.body.data).toHaveProperty('dependencies');
    });

    it('應該包含作業系統資訊', async () => {
      const response = await request(app)
        .get('/api/monitoring/system-info')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const os = response.body.data.os;
      expect(os).toHaveProperty('platform');
      expect(os).toHaveProperty('arch');
      expect(os).toHaveProperty('release');
      expect(os).toHaveProperty('hostname');
      expect(os).toHaveProperty('uptime');
    });

    it('應該包含 Node.js 資訊', async () => {
      const response = await request(app)
        .get('/api/monitoring/system-info')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const node = response.body.data.node;
      expect(node).toHaveProperty('version');
      expect(node).toHaveProperty('pid');
      expect(node).toHaveProperty('uptime');
      expect(node).toHaveProperty('memoryUsage');
    });

    it('應該包含應用程式資訊', async () => {
      const response = await request(app)
        .get('/api/monitoring/system-info')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const application = response.body.data.application;
      expect(application).toHaveProperty('name');
      expect(application).toHaveProperty('version');
      expect(application).toHaveProperty('environment');
      expect(application).toHaveProperty('startTime');
    });
  });

  describe('業務邏輯測試', () => {
    it('應該正確計算系統負載', async () => {
      const response = await request(app)
        .get('/api/monitoring/health')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const cpu = response.body.data.cpu;
      expect(cpu.usage).toBeGreaterThanOrEqual(0);
      expect(cpu.usage).toBeLessThanOrEqual(100);
    });

    it('應該正確計算記憶體使用率', async () => {
      const response = await request(app)
        .get('/api/monitoring/health')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const memory = response.body.data.memory;
      expect(memory.percentage).toBeGreaterThanOrEqual(0);
      expect(memory.percentage).toBeLessThanOrEqual(100);
      expect(memory.used).toBeLessThanOrEqual(memory.total);
    });

    it('應該檢測資料庫連接狀態', async () => {
      const response = await request(app)
        .get('/api/monitoring/health')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const database = response.body.data.database;
      expect(['connected', 'disconnected', 'connecting']).toContain(database.status);
      expect(typeof database.responseTime).toBe('number');
    });

    it('應該追蹤 API 回應時間', async () => {
      const response = await request(app)
        .get('/api/monitoring/performance')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      const endpoints = response.body.data.endpoints;
      endpoints.forEach((endpoint: any) => {
        expect(typeof endpoint.averageResponseTime).toBe('number');
        expect(endpoint.averageResponseTime).toBeGreaterThan(0);
      });
    });
  });

  describe('錯誤處理測試', () => {
    it('應該處理系統資源不足', async () => {
      // 模擬記憶體不足情況
      const originalMemoryUsage = process.memoryUsage;
      (process.memoryUsage as any) = jest.fn().mockReturnValue({
        rss: 1000000000, // 1GB
        heapTotal: 900000000,
        heapUsed: 850000000, // 85% 使用率
        external: 50000000,
        arrayBuffers: 10000000
      });

      const response = await request(app)
        .get('/api/monitoring/health')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.memory.percentage).toBeGreaterThan(80);

      // 恢復原始函數
      process.memoryUsage = originalMemoryUsage;
    });

    it('應該處理資料庫連接失敗', async () => {
      // 模擬資料庫連接錯誤
      const mockConnection = jest.spyOn(mongoose.connection, 'readyState', 'get')
        .mockReturnValue(0); // 0 = disconnected

      const response = await request(app)
        .get('/api/monitoring/health')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.database.status).toBe('disconnected');

      mockConnection.mockRestore();
    });

    it('應該處理無效的時間範圍', async () => {
      const response = await request(app)
        .get('/api/monitoring/metrics?timeRange=invalid')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('應該處理無效的日誌等級', async () => {
      const response = await request(app)
        .get('/api/monitoring/logs?level=invalid')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('安全性測試', () => {
    it('應該要求身份驗證', async () => {
      const response = await request(app)
        .get('/api/monitoring/health')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('應該檢查管理員權限', async () => {
      // 使用非管理員 token（如果有實現權限檢查）
      const response = await request(app)
        .get('/api/monitoring/system-info')
        .set('Authorization', 'Bearer regular-user-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('應該過濾敏感資訊', async () => {
      const response = await request(app)
        .get('/api/monitoring/system-info')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      // 確保不包含敏感資訊如密碼、密鑰等
      const responseStr = JSON.stringify(response.body);
      expect(responseStr).not.toContain('password');
      expect(responseStr).not.toContain('secret');
      expect(responseStr).not.toContain('key');
    });
  });

  describe('性能測試', () => {
    it('健康檢查應該快速回應', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/monitoring/health')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(1000); // 1秒內完成
    });

    it('指標查詢應該高效', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/monitoring/metrics')
        .set('Authorization', 'Bearer test-mode-token')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(2000); // 2秒內完成
    });
  });
});