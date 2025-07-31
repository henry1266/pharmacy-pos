import { CacheService, Cacheable, CacheEvict, cacheService, cacheMiddleware } from '../CacheService';

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    exists: jest.fn(),
    info: jest.fn()
  }))
}));

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    // 清除環境變數以確保使用記憶體快取
    delete process.env.REDIS_URL;
    delete process.env.REDIS_HOST;
    cache = new CacheService();
  });

  afterEach(async () => {
    await cache.close();
  });

  describe('記憶體快取功能', () => {
    test('應該能夠設置和獲取快取項目', async () => {
      const key = 'test-key';
      const value = { data: 'test-value', number: 123 };

      // 設置快取
      const setResult = await cache.set(key, value, 300);
      expect(setResult).toBe(true);

      // 獲取快取
      const cachedValue = await cache.get(key);
      expect(cachedValue).toEqual(value);
    });

    test('應該能夠刪除快取項目', async () => {
      const key = 'test-delete';
      const value = 'test-value';

      await cache.set(key, value);
      expect(await cache.get(key)).toBe(value);

      const deleteResult = await cache.delete(key);
      expect(deleteResult).toBe(true);
      expect(await cache.get(key)).toBeNull();
    });

    test('應該能夠檢查快取項目是否存在', async () => {
      const key = 'test-exists';
      const value = 'test-value';

      expect(await cache.exists(key)).toBe(false);

      await cache.set(key, value);
      expect(await cache.exists(key)).toBe(true);

      await cache.delete(key);
      expect(await cache.exists(key)).toBe(false);
    });

    test('應該能夠清空所有快取', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      expect(await cache.get('key1')).toBe('value1');
      expect(await cache.get('key2')).toBe('value2');

      const clearResult = await cache.clear();
      expect(clearResult).toBe(true);

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
    });

    test('應該能夠批量刪除符合模式的快取項目', async () => {
      await cache.set('user:1', 'user1');
      await cache.set('user:2', 'user2');
      await cache.set('product:1', 'product1');

      const deletedCount = await cache.deletePattern('user:*');
      expect(deletedCount).toBe(2);

      expect(await cache.get('user:1')).toBeNull();
      expect(await cache.get('user:2')).toBeNull();
      expect(await cache.get('product:1')).toBe('product1');
    });
  });

  describe('TTL 和過期功能', () => {
    test('快取項目應該在 TTL 過期後自動失效', async () => {
      const key = 'test-ttl';
      const value = 'test-value';
      const ttl = 1; // 1 秒

      await cache.set(key, value, ttl);
      expect(await cache.get(key)).toBe(value);

      // 等待超過 TTL 時間
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(await cache.get(key)).toBeNull();
    });

    test('應該使用預設 TTL 當未指定時', async () => {
      const key = 'test-default-ttl';
      const value = 'test-value';

      await cache.set(key, value); // 不指定 TTL
      expect(await cache.get(key)).toBe(value);
    });
  });

  describe('統計功能', () => {
    test('應該正確追蹤快取統計', async () => {
      const key = 'test-stats';
      const value = 'test-value';

      // 初始統計
      let stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.sets).toBe(0);

      // 設置快取
      await cache.set(key, value);
      stats = cache.getStats();
      expect(stats.sets).toBe(1);

      // 命中快取
      await cache.get(key);
      stats = cache.getStats();
      expect(stats.hits).toBe(1);

      // 未命中快取
      await cache.get('non-existent-key');
      stats = cache.getStats();
      expect(stats.misses).toBe(1);

      // 檢查命中率
      expect(stats.hitRate).toBe(50); // 1 hit / 2 total = 50%
    });
  });

  describe('快取資訊', () => {
    test('應該返回快取資訊', async () => {
      const info = await cache.getInfo();

      expect(info).toHaveProperty('type', 'Memory');
      expect(info).toHaveProperty('stats');
      expect(info).toHaveProperty('config');
      expect(info).toHaveProperty('memory');
      expect(info.memory).toHaveProperty('itemCount');
      expect(info.memory).toHaveProperty('memoryUsage');
    });
  });

  describe('錯誤處理', () => {
    test('應該優雅地處理獲取不存在的鍵', async () => {
      const result = await cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    test('應該優雅地處理刪除不存在的鍵', async () => {
      const result = await cache.delete('non-existent-key');
      expect(result).toBe(false);
    });
  });
});

describe('快取裝飾器', () => {
  let testService: TestService;

  beforeEach(() => {
    testService = new TestService();
  });

  afterEach(async () => {
    await cacheService.clear();
  });

  class TestService {
    callCount = 0;

    @Cacheable(300, (args) => `test:${args[0]}`)
    async getData(id: string): Promise<string> {
      this.callCount++;
      return `data-${id}`;
    }

    @CacheEvict('test:*')
    async updateData(id: string): Promise<void> {
      // 模擬更新操作
    }
  }

  test('Cacheable 裝飾器應該快取方法結果', async () => {
    const result1 = await testService.getData('123');
    expect(result1).toBe('data-123');
    expect(testService.callCount).toBe(1);

    // 第二次調用應該從快取返回
    const result2 = await testService.getData('123');
    expect(result2).toBe('data-123');
    expect(testService.callCount).toBe(1); // 沒有增加
  });

  test('CacheEvict 裝飾器應該清除相關快取', async () => {
    // 先設置一些快取
    await testService.getData('123');
    await testService.getData('456');
    expect(testService.callCount).toBe(2);

    // 清除快取
    await testService.updateData('123');

    // 再次調用應該重新執行方法
    await testService.getData('123');
    expect(testService.callCount).toBe(3);
  });
});

describe('快取中間件', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      originalUrl: '/api/test',
      query: {}
    };

    mockRes = {
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  afterEach(async () => {
    await cacheService.clear();
  });

  test('應該快取成功的響應', async () => {
    const middleware = cacheMiddleware(300);
    
    // 第一次請求
    await middleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();

    // 模擬成功響應
    const originalJson = mockRes.json;
    const testData = { success: true, data: 'test' };
    mockRes.json(testData);

    // 第二次相同請求
    mockNext.mockClear();
    await middleware(mockReq, mockRes, mockNext);
    
    // 應該從快取返回，不調用 next
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('應該使用自定義鍵生成器', async () => {
    const customKeyGenerator = (req: any) => `custom:${req.originalUrl}`;
    const middleware = cacheMiddleware(300, customKeyGenerator);

    await middleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('配置選項', () => {
  test('應該使用自定義配置創建快取服務', () => {
    const customConfig = {
      keyPrefix: 'custom:',
      defaultTTL: 600
    };

    const customCache = new CacheService(customConfig);
    expect(customCache).toBeInstanceOf(CacheService);
  });

  test('應該使用環境變數配置', () => {
    process.env.REDIS_KEY_PREFIX = 'env-test:';
    process.env.CACHE_DEFAULT_TTL = '900';

    const envCache = new CacheService();
    expect(envCache).toBeInstanceOf(CacheService);

    // 清理環境變數
    delete process.env.REDIS_KEY_PREFIX;
    delete process.env.CACHE_DEFAULT_TTL;
  });
});

describe('全域快取服務實例', () => {
  test('應該提供全域快取服務實例', () => {
    expect(cacheService).toBeInstanceOf(CacheService);
  });

  test('全域實例應該正常工作', async () => {
    await cacheService.set('global-test', 'value');
    const result = await cacheService.get('global-test');
    expect(result).toBe('value');
  });
});