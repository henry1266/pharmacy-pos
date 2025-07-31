import { createClient, RedisClientType } from 'redis';

// 快取配置介面
interface CacheConfig {
  host: string;
  port: number;
  password?: string | undefined;
  db?: number;
  keyPrefix?: string;
  defaultTTL?: number;
}

// 快取項目介面
interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

// 快取統計介面
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

/**
 * 快取服務類
 * 支援 Redis 和記憶體快取
 */
export class CacheService {
  private redisClient: RedisClientType | null = null;
  private memoryCache: Map<string, CacheItem> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0
  };
  private config: CacheConfig;
  private useRedis: boolean = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'pharmacy-pos:',
      defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '300'), // 5分鐘
      ...config
    };

    this.initializeCache();
  }

  /**
   * 初始化快取系統
   */
  private async initializeCache() {
    try {
      // 嘗試連接 Redis
      if (process.env.REDIS_URL || (this.config.host && this.config.port)) {
        await this.initializeRedis();
      } else {
        console.log('📦 使用記憶體快取 (未配置 Redis)');
        this.initializeMemoryCache();
      }
    } catch (error) {
      console.warn('⚠️ Redis 連接失敗，回退到記憶體快取:', error);
      this.initializeMemoryCache();
    }
  }

  /**
   * 初始化 Redis 快取
   */
  private async initializeRedis() {
    const redisUrl = process.env.REDIS_URL || 
      `redis://${this.config.password ? `:${this.config.password}@` : ''}${this.config.host}:${this.config.port}/${this.config.db}`;

    this.redisClient = createClient({
      url: redisUrl
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis 錯誤:', err);
      this.fallbackToMemoryCache();
    });

    this.redisClient.on('connect', () => {
      console.log('✅ Redis 連接成功');
      this.useRedis = true;
    });

    this.redisClient.on('disconnect', () => {
      console.warn('⚠️ Redis 連接中斷，回退到記憶體快取');
      this.fallbackToMemoryCache();
    });

    await this.redisClient.connect();
  }

  /**
   * 初始化記憶體快取
   */
  private initializeMemoryCache() {
    this.useRedis = false;
    
    // 設置清理過期項目的定時器
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredItems();
    }, 60000); // 每分鐘清理一次

    console.log('📦 記憶體快取已初始化');
  }

  /**
   * 回退到記憶體快取
   */
  private fallbackToMemoryCache() {
    this.useRedis = false;
    if (!this.cleanupInterval) {
      this.initializeMemoryCache();
    }
  }

  /**
   * 清理過期的記憶體快取項目
   */
  private cleanupExpiredItems() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl * 1000) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 清理了 ${cleanedCount} 個過期的快取項目`);
    }
  }

  /**
   * 生成快取鍵
   */
  private generateKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * 獲取快取項目
   */
  async get<T = any>(key: string): Promise<T | null> {
    const fullKey = this.generateKey(key);

    try {
      if (this.useRedis && this.redisClient) {
        const value = await this.redisClient.get(fullKey);
        if (value) {
          this.stats.hits++;
          this.updateHitRate();
          return JSON.parse(value);
        }
      } else {
        const item = this.memoryCache.get(fullKey);
        if (item) {
          const now = Date.now();
          if (now - item.timestamp < item.ttl * 1000) {
            this.stats.hits++;
            this.updateHitRate();
            return item.data;
          } else {
            // 過期項目
            this.memoryCache.delete(fullKey);
          }
        }
      }

      this.stats.misses++;
      this.updateHitRate();
      return null;
    } catch (error) {
      console.error('快取獲取錯誤:', error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * 設置快取項目
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<boolean> {
    const fullKey = this.generateKey(key);
    const cacheTTL = ttl || this.config.defaultTTL!;

    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.setEx(fullKey, cacheTTL, JSON.stringify(value));
      } else {
        const item: CacheItem<T> = {
          data: value,
          timestamp: Date.now(),
          ttl: cacheTTL
        };
        this.memoryCache.set(fullKey, item);
      }

      this.stats.sets++;
      return true;
    } catch (error) {
      console.error('快取設置錯誤:', error);
      return false;
    }
  }

  /**
   * 刪除快取項目
   */
  async delete(key: string): Promise<boolean> {
    const fullKey = this.generateKey(key);

    try {
      if (this.useRedis && this.redisClient) {
        const result = await this.redisClient.del(fullKey);
        this.stats.deletes++;
        return result > 0;
      } else {
        const result = this.memoryCache.delete(fullKey);
        if (result) this.stats.deletes++;
        return result;
      }
    } catch (error) {
      console.error('快取刪除錯誤:', error);
      return false;
    }
  }

  /**
   * 批量刪除快取項目
   */
  async deletePattern(pattern: string): Promise<number> {
    const fullPattern = this.generateKey(pattern);

    try {
      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys(fullPattern);
        if (keys.length > 0) {
          const result = await this.redisClient.del(keys);
          this.stats.deletes += result;
          return result;
        }
        return 0;
      } else {
        let deletedCount = 0;
        const regex = new RegExp(fullPattern.replace(/\*/g, '.*'));
        
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
            deletedCount++;
          }
        }
        
        this.stats.deletes += deletedCount;
        return deletedCount;
      }
    } catch (error) {
      console.error('批量刪除快取錯誤:', error);
      return 0;
    }
  }

  /**
   * 清空所有快取
   */
  async clear(): Promise<boolean> {
    try {
      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys(`${this.config.keyPrefix}*`);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      } else {
        this.memoryCache.clear();
      }

      // 重置統計
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        hitRate: 0
      };

      return true;
    } catch (error) {
      console.error('清空快取錯誤:', error);
      return false;
    }
  }

  /**
   * 檢查快取項目是否存在
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = this.generateKey(key);

    try {
      if (this.useRedis && this.redisClient) {
        const result = await this.redisClient.exists(fullKey);
        return result > 0;
      } else {
        const item = this.memoryCache.get(fullKey);
        if (item) {
          const now = Date.now();
          if (now - item.timestamp < item.ttl * 1000) {
            return true;
          } else {
            this.memoryCache.delete(fullKey);
          }
        }
        return false;
      }
    } catch (error) {
      console.error('檢查快取存在性錯誤:', error);
      return false;
    }
  }

  /**
   * 獲取快取統計
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 更新命中率
   */
  private updateHitRate() {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * 獲取快取資訊
   */
  async getInfo(): Promise<any> {
    const info: any = {
      type: this.useRedis ? 'Redis' : 'Memory',
      stats: this.getStats(),
      config: {
        defaultTTL: this.config.defaultTTL,
        keyPrefix: this.config.keyPrefix
      }
    };

    if (this.useRedis && this.redisClient) {
      try {
        const redisInfo = await this.redisClient.info();
        info.redis = {
          connected: true,
          info: redisInfo
        };
      } catch (error) {
        info.redis = {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    } else {
      info.memory = {
        itemCount: this.memoryCache.size,
        memoryUsage: process.memoryUsage()
      };
    }

    return info;
  }

  /**
   * 關閉快取服務
   */
  async close(): Promise<void> {
    try {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }

      if (this.redisClient) {
        await this.redisClient.quit();
        this.redisClient = null;
      }

      this.memoryCache.clear();
      console.log('📦 快取服務已關閉');
    } catch (error) {
      console.error('關閉快取服務錯誤:', error);
    }
  }
}

// 快取裝飾器
export function Cacheable(ttl?: number, keyGenerator?: (args: any[]) => string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator 
        ? keyGenerator(args)
        : `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      // 嘗試從快取獲取
      const cached = await cacheService.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // 執行原方法
      const result = await method.apply(this, args);

      // 存入快取
      if (result !== null && result !== undefined) {
        await cacheService.set(cacheKey, result, ttl);
      }

      return result;
    };
  };
}

// 快取失效裝飾器
export function CacheEvict(pattern: string) {
  return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);

      // 清除相關快取
      await cacheService.deletePattern(pattern);

      return result;
    };
  };
}

// 全域快取服務實例
export const cacheService = new CacheService();

// 快取中間件
export const cacheMiddleware = (ttl: number = 300, keyGenerator?: (req: any) => string) => {
  return async (req: any, res: any, next: any) => {
    const cacheKey = keyGenerator 
      ? keyGenerator(req)
      : `api:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // 攔截 res.json 來快取響應
      const originalJson = res.json;
      res.json = function (data: any) {
        // 只快取成功的響應
        if (data && data.success !== false) {
          cacheService.set(cacheKey, data, ttl).catch(console.error);
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('快取中間件錯誤:', error);
      next();
    }
  };
};

export default CacheService;