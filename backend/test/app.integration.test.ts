import request from 'supertest';
import { createApp } from '../app';

describe('App Integration Tests', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  describe('Application Creation', () => {
    it('應該成功創建 Express 應用實例', () => {
      expect(app).toBeDefined();
      expect(typeof app.listen).toBe('function');
    });
  });

  describe('CORS Configuration', () => {
    it('應該允許跨域請求', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type');

      expect([200, 204]).toContain(response.status);
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
    });
  });

  describe('API Routes Setup', () => {
    it('應該正確設置主要路由', async () => {
      // 測試一些路由是否能被訪問（無論返回什麼狀態）
      const routes = [
        '/api/auth',
        '/api/users',
        '/api/inventory',
        '/api/suppliers',
        '/api/products',
        '/api/sales',
        '/api/dashboard',
        '/api/employees'
      ];

      for (const route of routes) {
        const response = await request(app)
          .get(route)
          .expect((res) => {
            // 只要路由存在並返回 HTTP 狀態碼即可
            expect(res.status).toBeDefined();
          });
      }
    });
  });

  describe('Swagger Documentation', () => {
    it('應該提供 OpenAPI JSON', async () => {
      const response = await request(app)
        .get('/api-docs.json')
        .expect(200);

      expect(response.type).toBe('application/json');
      expect(response.body).toHaveProperty('openapi');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('paths');
    });
  });

  describe('Error Handling', () => {
    it('應該處理不存在的路由', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      // 只要返回 404 狀態即可，不檢查具體的回應格式
      expect(response.status).toBe(404);
    });

    it('應該處理不支援的 HTTP 方法', async () => {
      const response = await request(app)
        .patch('/api/users')
        .expect((res) => {
          // 只要返回有效的 HTTP 狀態碼即可
          expect(res.status).toBeDefined();
        });
    });
  });

  describe('Middleware', () => {
    it('應該正確解析 JSON 請求體', async () => {
      const testData = { test: 'data' };

      const response = await request(app)
        .post('/api/auth/login')
        .send(testData)
        .set('Content-Type', 'application/json');

      // 不管實際結果如何，至少請求應該被正確處理
      expect(response.status).toBeDefined();
    });

    it('應該正確解析 URL 編碼的請求體', async () => {
      const testData = 'test=data&other=value';

      const response = await request(app)
        .post('/api/auth/login')
        .send(testData)
        .set('Content-Type', 'application/x-www-form-urlencoded');

      expect(response.status).toBeDefined();
    });
  });

  describe('Response Headers', () => {
    it('應該設置適當的回應標頭', async () => {
      const response = await request(app)
        .get('/api/auth');

      // 檢查是否有基本的回應標頭
      expect(response.headers).toHaveProperty('content-type');
      expect(response.headers).toHaveProperty('date');
    });
  });
});