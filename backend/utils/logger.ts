import winston from 'winston';
import path from 'path';

// 定義日誌級別
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 定義日誌顏色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// 告訴 winston 使用這些顏色
winston.addColors(colors);

// 自定義格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// 定義不同環境的日誌級別
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// 定義傳輸方式
const transports = [
  // 控制台輸出
  new winston.transports.Console({
    level: level(),
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // 錯誤日誌檔案
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // 所有日誌檔案
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// 創建 logger 實例
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

// 性能監控日誌
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'performance.log'),
      maxsize: 5242880,
      maxFiles: 3,
    })
  ]
});

// API 請求日誌
export const apiLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'api.log'),
      maxsize: 5242880,
      maxFiles: 3,
    })
  ]
});

// 資料庫操作日誌
export const dbLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'database.log'),
      maxsize: 5242880,
      maxFiles: 3,
    })
  ]
});

// 業務邏輯日誌
export const businessLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'business.log'),
      maxsize: 5242880,
      maxFiles: 3,
    })
  ]
});

// 輔助函數：記錄 API 請求
export const logApiRequest = (req: any, res: any, responseTime: number) => {
  apiLogger.info('API Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    timestamp: new Date().toISOString()
  });
};

// 輔助函數：記錄資料庫查詢
export const logDbQuery = (operation: string, collection: string, duration: number, error?: Error) => {
  const logData = {
    operation,
    collection,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  };

  if (error) {
    dbLogger.error('Database Query Error', {
      ...logData,
      error: error.message,
      stack: error.stack
    });
  } else {
    dbLogger.info('Database Query', logData);
  }
};

// 輔助函數：記錄業務操作
export const logBusinessOperation = (
  operation: string, 
  userId: string, 
  details: any, 
  success: boolean = true,
  error?: Error
) => {
  const logData = {
    operation,
    userId,
    details,
    success,
    timestamp: new Date().toISOString()
  };

  if (error) {
    businessLogger.error('Business Operation Failed', {
      ...logData,
      error: error.message,
      stack: error.stack
    });
  } else {
    businessLogger.info('Business Operation', logData);
  }
};

// 輔助函數：記錄性能指標
export const logPerformance = (metric: string, value: number, unit: string = 'ms', tags?: any) => {
  performanceLogger.info('Performance Metric', {
    metric,
    value,
    unit,
    tags,
    timestamp: new Date().toISOString()
  });
};

// 創建日誌目錄
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export default logger;