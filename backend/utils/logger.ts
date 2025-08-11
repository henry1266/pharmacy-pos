import winston from 'winston';
import path from 'path';

/**
 * @description 定義日誌級別
 * @type {Object.<string, number>}
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * @description 定義日誌顏色
 * @type {Object.<string, string>}
 */
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// 告訴 winston 使用這些顏色
winston.addColors(colors);

/**
 * @description 自定義日誌格式
 * @type {winston.Logform.Format}
 */
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

/**
 * @description 根據環境定義日誌級別
 * @returns {string} 日誌級別
 */
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

/**
 * @description 定義日誌傳輸方式
 * @type {winston.transport[]}
 */
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

/**
 * @description 創建主要日誌實例
 * @type {winston.Logger}
 */
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

/**
 * @description 性能監控專用日誌實例
 * @type {winston.Logger}
 */
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

/**
 * @description API請求專用日誌實例
 * @type {winston.Logger}
 */
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

/**
 * @description 資料庫操作專用日誌實例
 * @type {winston.Logger}
 */
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

/**
 * @description 業務邏輯專用日誌實例
 * @type {winston.Logger}
 */
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

/**
 * @description 記錄API請求的輔助函數
 * @param {any} req - Express請求對象
 * @param {any} res - Express響應對象
 * @param {number} responseTime - 請求處理時間(毫秒)
 * @returns {void}
 */
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

/**
 * @description 記錄資料庫查詢的輔助函數
 * @param {string} operation - 操作類型(如find, update, insert等)
 * @param {string} collection - 集合/表名
 * @param {number} duration - 查詢執行時間(毫秒)
 * @param {Error} [error] - 錯誤對象(如果有)
 * @returns {void}
 */
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

/**
 * @description 記錄業務操作的輔助函數
 * @param {string} operation - 操作名稱
 * @param {string} userId - 用戶ID
 * @param {any} details - 操作詳情
 * @param {boolean} [success=true] - 操作是否成功
 * @param {Error} [error] - 錯誤對象(如果有)
 * @returns {void}
 */
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

/**
 * @description 記錄性能指標的輔助函數
 * @param {string} metric - 指標名稱
 * @param {number} value - 指標值
 * @param {string} [unit='ms'] - 單位(默認為毫秒)
 * @param {any} [tags] - 附加標籤
 * @returns {void}
 */
export const logPerformance = (metric: string, value: number, unit: string = 'ms', tags?: any) => {
  performanceLogger.info('Performance Metric', {
    metric,
    value,
    unit,
    tags,
    timestamp: new Date().toISOString()
  });
};

/**
 * @description 創建日誌目錄(如不存在)
 */
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * @description 導出主要日誌實例
 */
export default logger;