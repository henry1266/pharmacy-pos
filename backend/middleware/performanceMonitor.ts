import { Request, Response, NextFunction } from 'express';

// 性能監控中間件
export interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

// 存儲性能指標
const performanceMetrics: Map<string, PerformanceMetrics> = new Map();

// 生成請求ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 性能監控中間件
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const startCpuUsage = process.cpuUsage();

  // 將請求ID添加到請求對象
  (req as any).requestId = requestId;

  // 記錄開始指標
  const metrics: PerformanceMetrics = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    startTime,
    memoryUsage: process.memoryUsage(),
    cpuUsage: startCpuUsage
  };

  performanceMetrics.set(requestId, metrics);

  // 監聽響應結束事件
  res.on('finish', () => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const endCpuUsage = process.cpuUsage(startCpuUsage);

    // 更新指標
    const updatedMetrics: PerformanceMetrics = {
      ...metrics,
      endTime,
      duration,
      statusCode: res.statusCode,
      memoryUsage: process.memoryUsage(),
      cpuUsage: endCpuUsage
    };

    performanceMetrics.set(requestId, updatedMetrics);

    // 記錄性能日誌
    logPerformanceMetrics(updatedMetrics);

    // 清理舊的指標（保留最近1000個）
    if (performanceMetrics.size > 1000) {
      const oldestKey = performanceMetrics.keys().next().value;
      if (oldestKey !== undefined) {
        performanceMetrics.delete(oldestKey);
      }
    }
  });

  next();
};

// 記錄性能指標
function logPerformanceMetrics(metrics: PerformanceMetrics) {
  const {
    requestId,
    method,
    url,
    duration,
    statusCode,
    memoryUsage,
    cpuUsage
  } = metrics;

  // 基本性能日誌
  console.log(`[PERF] ${method} ${url} - ${duration}ms - ${statusCode}`);

  // 詳細性能指標（僅在開發環境或慢請求時記錄）
  if (process.env.NODE_ENV === 'development' || (duration && duration > 1000)) {
    console.log(`[PERF-DETAIL] ${requestId}:`, {
      duration: `${duration}ms`,
      memory: {
        rss: `${Math.round((memoryUsage?.rss || 0) / 1024 / 1024)}MB`,
        heapUsed: `${Math.round((memoryUsage?.heapUsed || 0) / 1024 / 1024)}MB`,
        heapTotal: `${Math.round((memoryUsage?.heapTotal || 0) / 1024 / 1024)}MB`
      },
      cpu: {
        user: `${Math.round((cpuUsage?.user || 0) / 1000)}ms`,
        system: `${Math.round((cpuUsage?.system || 0) / 1000)}ms`
      }
    });
  }

  // 警告慢請求
  if (duration && duration > 5000) {
    console.warn(`[SLOW-REQUEST] ${method} ${url} took ${duration}ms`);
  }

  // 警告高記憶體使用
  if (memoryUsage && memoryUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
    console.warn(`[HIGH-MEMORY] Request ${requestId} used ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB heap`);
  }
}

// 獲取性能統計
export function getPerformanceStats() {
  const metrics = Array.from(performanceMetrics.values());
  
  if (metrics.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      slowestRequest: null,
      fastestRequest: null,
      statusCodeDistribution: {},
      memoryStats: null
    };
  }

  const durations = metrics
    .filter(m => m.duration !== undefined)
    .map(m => m.duration!);

  const statusCodes = metrics
    .filter(m => m.statusCode !== undefined)
    .map(m => m.statusCode!);

  const statusCodeDistribution = statusCodes.reduce((acc, code) => {
    acc[code] = (acc[code] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const averageResponseTime = durations.length > 0 
    ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
    : 0;

  const slowestRequest = metrics.reduce((slowest, current) => {
    if (!current.duration) return slowest;
    if (!slowest || !slowest.duration || current.duration > slowest.duration) {
      return current;
    }
    return slowest;
  }, null as PerformanceMetrics | null);

  const fastestRequest = metrics.reduce((fastest, current) => {
    if (!current.duration) return fastest;
    if (!fastest || !fastest.duration || current.duration < fastest.duration) {
      return current;
    }
    return fastest;
  }, null as PerformanceMetrics | null);

  const currentMemory = process.memoryUsage();

  return {
    totalRequests: metrics.length,
    averageResponseTime: Math.round(averageResponseTime),
    slowestRequest: slowestRequest ? {
      url: slowestRequest.url,
      method: slowestRequest.method,
      duration: slowestRequest.duration
    } : null,
    fastestRequest: fastestRequest ? {
      url: fastestRequest.url,
      method: fastestRequest.method,
      duration: fastestRequest.duration
    } : null,
    statusCodeDistribution,
    memoryStats: {
      rss: Math.round(currentMemory.rss / 1024 / 1024),
      heapUsed: Math.round(currentMemory.heapUsed / 1024 / 1024),
      heapTotal: Math.round(currentMemory.heapTotal / 1024 / 1024),
      external: Math.round(currentMemory.external / 1024 / 1024)
    }
  };
}

// 清理性能指標
export function clearPerformanceMetrics() {
  performanceMetrics.clear();
}

// 獲取最近的慢請求
export function getSlowRequests(threshold: number = 1000, limit: number = 10) {
  return Array.from(performanceMetrics.values())
    .filter(m => m.duration && m.duration > threshold)
    .sort((a, b) => (b.duration || 0) - (a.duration || 0))
    .slice(0, limit)
    .map(m => ({
      requestId: m.requestId,
      method: m.method,
      url: m.url,
      duration: m.duration,
      statusCode: m.statusCode,
      timestamp: new Date(m.startTime).toISOString()
    }));
}

// 系統健康檢查
export function getSystemHealth() {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const uptime = process.uptime();

  // 計算記憶體使用百分比（假設系統有4GB記憶體）
  const totalMemory = 4 * 1024 * 1024 * 1024; // 4GB in bytes
  const memoryUsagePercent = (memoryUsage.rss / totalMemory) * 100;

  return {
    status: memoryUsagePercent > 80 ? 'warning' : 'healthy',
    uptime: Math.round(uptime),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      usagePercent: Math.round(memoryUsagePercent)
    },
    cpu: {
      user: Math.round(cpuUsage.user / 1000),
      system: Math.round(cpuUsage.system / 1000)
    },
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  };
}

export default performanceMonitor;