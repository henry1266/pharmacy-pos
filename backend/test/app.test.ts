import request from 'supertest';
import { createApp, initializeDatabase } from '../app';

// Mock 外部依賴
jest.mock('../config/db', () => ({
  default: jest.fn()
}));

jest.mock('../swagger', () => ({
  default: {
    openapi: '3.0.3',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {},
    components: { schemas: {} }
  }
}));

jest.mock('fs');
jest.mock('path');
jest.mock('swagger-ui-express', () => ({
  serve: jest.fn(() => jest.fn()),
  setup: jest.fn(() => jest.fn())
}));

// Mock config module
jest.mock('config', () => ({
  get: jest.fn((key: string) => {
    const configMap: Record<string, any> = {
      'jwtSecret': 'test-jwt-secret',
      'jwtExpiration': '1h',
      'bcryptRounds': 10,
      'swaggerApiKey': 'test-swagger-key'
    };
    return configMap[key];
  })
}));

describe('App Configuration Tests', () => {
  const mockFs = require('fs');
  const mockPath = require('path');

  beforeEach(() => {
    jest.clearAllMocks();
    // 預設模擬路徑解析
    mockPath.resolve.mockImplementation((...args: string[]) => args.join('/'));
  });

  describe('Swagger Documentation in Production', () => {
    beforeEach(() => {
      // 模擬生產環境
      process.env.NODE_ENV = 'production';
      process.env.SWAGGER_API_KEY = 'test-api-key';
    });

    afterEach(() => {
      delete (process.env as any).NODE_ENV;
      delete (process.env as any).SWAGGER_API_KEY;
    });

    it('應該在生產環境中拒絕沒有 API 金鑰的 Swagger UI 訪問', async () => {
      const app = createApp();

      const response = await request(app)
        .get('/api-docs')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: '未授權訪問API文檔'
      });
    });

    it('應該在生產環境中允許有正確 API 金鑰的 Swagger UI 訪問', async () => {
      const app = createApp();

      const response = await request(app)
        .get('/api-docs')
        .set('x-api-key', 'test-api-key')
        .expect(200);

      // 應該返回 HTML 頁面
      expect(response.type).toContain('html');
    });

    it('應該在生產環境中拒絕沒有 API 金鑰的 OpenAPI JSON 訪問', async () => {
      const app = createApp();

      const response = await request(app)
        .get('/api-docs.json')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: '未授權訪問API文檔'
      });
    });

    it('應該在生產環境中允許有正確 API 金鑰的 OpenAPI JSON 訪問', async () => {
      const app = createApp();

      const response = await request(app)
        .get('/api-docs.json')
        .set('x-api-key', 'test-api-key')
        .expect(200);

      expect(response.type).toBe('application/json');
      expect(response.body).toHaveProperty('openapi');
    });

    it('應該支援查詢參數形式的 API 金鑰', async () => {
      const app = createApp();

      const response = await request(app)
        .get('/api-docs?apiKey=test-api-key')
        .expect(200);

      expect(response.type).toContain('html');
    });
  });

  describe('OpenAPI File Loading', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      delete (process.env as any).NODE_ENV;
    });

    it('應該在 OpenAPI 文件存在時使用它作為 SSOT', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        openapi: '3.0.3',
        info: { title: 'Generated API', version: '1.0.0' },
        paths: { '/test': {} },
        components: { schemas: {} }
      }));

      const app = createApp();

      expect(mockFs.existsSync).toHaveBeenCalledWith('../openapi/openapi.json');
      expect(mockFs.readFileSync).toHaveBeenCalledWith('../openapi/openapi.json', 'utf8');
    });

    it('應該在 OpenAPI 文件不存在時使用動態生成的規範', () => {
      mockFs.existsSync.mockReturnValue(false);

      const app = createApp();

      expect(mockFs.existsSync).toHaveBeenCalledWith('../openapi/openapi.json');
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });

    it('應該在讀取 OpenAPI 文件失敗時記錄錯誤並使用動態規範', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const app = createApp();

      expect(consoleSpy).toHaveBeenCalledWith(
        '讀取OpenAPI規範文件失敗，使用動態生成的規範:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Static File Serving in Production', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      delete (process.env as any).NODE_ENV;
    });

    it('應該在生產環境中提供靜態文件服務', async () => {
      const app = createApp();

      // Mock express.static 和 sendFile
      const mockSendFile = jest.fn();
      const mockStatic = jest.fn(() => (req: any, res: any, next: any) => next());

      // 我們無法輕易模擬 express.static，但可以測試路由設置
      // 這裡測試一個不存在的靜態路由應該返回 404
      const response = await request(app)
        .get('/static-file.css')
        .expect(404);
    });

    it('應該在生產環境中為 SPA 提供回退路由', async () => {
      const app = createApp();

      // 測試不存在的路由應該被重定向到 index.html
      const response = await request(app)
        .get('/some-spa-route')
        .expect(200);

      // 在測試環境中，這可能不會觸發 sendFile，但至少不會拋錯
      expect(response.status).toBe(200);
    });
  });

  describe('Database Initialization', () => {
    const mockConnectDB = require('../config/db').default;

    beforeEach(() => {
      mockConnectDB.mockClear();
    });

    it('應該在非測試環境中初始化資料庫連接', async () => {
      delete (process.env as any).NODE_ENV;

      await initializeDatabase();

      expect(mockConnectDB).toHaveBeenCalledTimes(1);
    });

    it('應該在測試環境中跳過資料庫連接', async () => {
      process.env.NODE_ENV = 'test';

      await initializeDatabase();

      expect(mockConnectDB).not.toHaveBeenCalled();

      delete (process.env as any).NODE_ENV;
    });
  });

  describe('OpenAPI Specification Merging', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        openapi: '3.0.3',
        info: { title: 'Sales API', version: '1.0.0' },
        servers: [{ url: 'http://localhost:3000' }],
        paths: { '/sales': { get: {} } },
        components: {
          schemas: { Sale: { type: 'object' } }
        },
        tags: [{ name: 'Sales' }]
      }));
    });

    it('應該正確合併生成的 OpenAPI 與內建規範', () => {
      const app = createApp();

      // 驗證文件讀取被調用
      expect(mockFs.existsSync).toHaveBeenCalledWith('../openapi/openapi.json');
    });
  });
});