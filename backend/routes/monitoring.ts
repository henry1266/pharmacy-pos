import express, { Request, Response, NextFunction, Router } from 'express';
import mongoose from 'mongoose';
import {
  getPerformanceStats,
  getSlowRequests,
  getSystemHealth,
  clearPerformanceMetrics
} from '../middleware/performanceMonitor';

const router: Router = express.Router();

// 健康檢查端點
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: 'unknown',
      memory: process.memoryUsage(),
      system: getSystemHealth()
    };

    // 檢查資料庫連接
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        health.database = 'connected';
      } else {
        health.database = 'disconnected';
        health.status = 'error';
      }
    } catch (error) {
      health.database = 'disconnected';
      health.status = 'error';
    }

    // 檢查記憶體使用情況
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.rss / (4 * 1024 * 1024 * 1024)) * 100; // 假設4GB系統記憶體

    if (memoryUsagePercent > 90) {
      health.status = 'critical';
    } else if (memoryUsagePercent > 70) {
      health.status = 'warning';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 詳細健康檢查端點
router.get('/health/detailed', async (_req: Request, res: Response) => {
  try {
    const systemHealth = getSystemHealth();
    const performanceStats = getPerformanceStats();
    const slowRequests = getSlowRequests(1000, 5);

    // 資料庫統計
    let dbStats = null;
    try {
      const db = mongoose.connection.db;
      if (db) {
        const stats = await db.stats();
        dbStats = {
          collections: stats.collections,
          dataSize: Math.round(stats.dataSize / 1024 / 1024), // MB
          indexSize: Math.round(stats.indexSize / 1024 / 1024), // MB
          storageSize: Math.round(stats.storageSize / 1024 / 1024) // MB
        };
      } else {
        dbStats = { error: 'Database connection not available' };
      }
    } catch (error) {
      dbStats = { error: 'Unable to fetch database statistics' };
    }

    const detailedHealth = {
      status: systemHealth.status,
      timestamp: new Date().toISOString(),
      system: systemHealth,
      performance: performanceStats,
      slowRequests,
      database: dbStats,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        env: process.env.NODE_ENV || 'development'
      }
    };

    res.json(detailedHealth);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 性能統計端點
router.get('/performance', (_req: Request, res: Response) => {
  try {
    const stats = getPerformanceStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 慢請求端點
router.get('/performance/slow', (req: Request, res: Response) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 1000;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const slowRequests = getSlowRequests(threshold, limit);
    
    res.json({
      success: true,
      data: {
        threshold: `${threshold}ms`,
        count: slowRequests.length,
        requests: slowRequests
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 系統資源使用情況
router.get('/system/resources', (_req: Request, res: Response) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // 獲取系統負載（僅在 Unix 系統上可用）
    let loadAverage = null;
    try {
      const os = require('os');
      loadAverage = os.loadavg();
    } catch (error) {
      // Windows 系統不支援 loadavg
    }

    const resources = {
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024) // MB
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000), // ms
        system: Math.round(cpuUsage.system / 1000) // ms
      },
      uptime: Math.round(process.uptime()), // seconds
      loadAverage,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version
    };

    res.json({
      success: true,
      data: resources,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 資料庫連接狀態
router.get('/database/status', async (_req: Request, res: Response) => {
  try {
    const connectionState = mongoose.connection.readyState;
    const stateNames = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    let dbInfo = null;
    if (connectionState === 1) {
      try {
        const db = mongoose.connection.db;
        if (db) {
          const admin = db.admin();
          const serverStatus = await admin.serverStatus();
          const dbStats = await db.stats();

          dbInfo = {
            host: serverStatus.host,
            version: serverStatus.version,
            uptime: serverStatus.uptime,
            connections: serverStatus.connections,
            stats: {
              collections: dbStats.collections,
              dataSize: Math.round(dbStats.dataSize / 1024 / 1024), // MB
              indexSize: Math.round(dbStats.indexSize / 1024 / 1024), // MB
              storageSize: Math.round(dbStats.storageSize / 1024 / 1024) // MB
            }
          };
        } else {
          dbInfo = { error: 'Database connection not available' };
        }
      } catch (error) {
        dbInfo = { error: 'Unable to fetch database info' };
      }
    }

    res.json({
      success: true,
      data: {
        state: stateNames[connectionState as keyof typeof stateNames] || 'unknown',
        stateCode: connectionState,
        info: dbInfo
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 清除性能指標（僅限開發環境）
router.post('/performance/clear', (_req: Request, res: Response, _next: NextFunction) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      res.status(403).json({
        success: false,
        error: 'This endpoint is only available in development environment',
        timestamp: new Date().toISOString()
      });
      return;
    }

    clearPerformanceMetrics();
    
    res.json({
      success: true,
      message: 'Performance metrics cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 記憶體垃圾回收（僅限開發環境）
router.post('/system/gc', (_req: Request, res: Response, _next: NextFunction) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      res.status(403).json({
        success: false,
        error: 'This endpoint is only available in development environment',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const beforeGC = process.memoryUsage();
    
    // 強制垃圾回收（需要 --expose-gc 標誌）
    if (global.gc) {
      global.gc();
    } else {
      res.status(400).json({
        success: false,
        error: 'Garbage collection is not exposed. Run with --expose-gc flag.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const afterGC = process.memoryUsage();

    res.json({
      success: true,
      message: 'Garbage collection completed',
      data: {
        before: {
          heapUsed: Math.round(beforeGC.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(beforeGC.heapTotal / 1024 / 1024), // MB
          rss: Math.round(beforeGC.rss / 1024 / 1024) // MB
        },
        after: {
          heapUsed: Math.round(afterGC.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(afterGC.heapTotal / 1024 / 1024), // MB
          rss: Math.round(afterGC.rss / 1024 / 1024) // MB
        },
        freed: {
          heapUsed: Math.round((beforeGC.heapUsed - afterGC.heapUsed) / 1024 / 1024), // MB
          heapTotal: Math.round((beforeGC.heapTotal - afterGC.heapTotal) / 1024 / 1024), // MB
          rss: Math.round((beforeGC.rss - afterGC.rss) / 1024 / 1024) // MB
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;