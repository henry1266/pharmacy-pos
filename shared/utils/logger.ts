/**
 * 通用日誌模組 - 前後端共用
 * 
 * 在後端環境中使用winston logger
 * 在前端環境中使用console
 */

// 判斷是否為後端環境
const isBackend = typeof process !== 'undefined' &&
                 typeof process.versions !== 'undefined' &&
                 typeof process.versions.node !== 'undefined';

// 嘗試導入後端logger (僅在後端環境中)
let backendLogger: any;
let backendBusinessLogger: any;

if (isBackend) {
  try {
    // 僅在後端環境中導入path模組
    const path = require('path');
    
    // 使用絕對路徑動態導入後端logger
    const projectRoot = path.resolve(__dirname, '../../..');
    const backendLoggerPath = path.join(projectRoot, 'backend/utils/logger');
    const backendLoggerModule = require(backendLoggerPath);
    backendLogger = backendLoggerModule.default;
    backendBusinessLogger = backendLoggerModule.businessLogger;
  } catch (error) {
    console.warn('無法載入後端logger，將使用console作為替代', error);
  }
}

/**
 * 通用logger介面
 */
export interface ILogger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}

/**
 * 前端logger實現 - 使用console
 */
class FrontendLogger implements ILogger {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix ? `[${prefix}] ` : '';
  }

  debug(message: string, meta?: any): void {
    if (meta) {
      console.debug(`${this.prefix}🔍 ${message}`, meta);
    } else {
      console.debug(`${this.prefix}🔍 ${message}`);
    }
  }

  info(message: string, meta?: any): void {
    if (meta) {
      console.info(`${this.prefix}✅ ${message}`, meta);
    } else {
      console.info(`${this.prefix}✅ ${message}`);
    }
  }

  warn(message: string, meta?: any): void {
    if (meta) {
      console.warn(`${this.prefix}⚠️ ${message}`, meta);
    } else {
      console.warn(`${this.prefix}⚠️ ${message}`);
    }
  }

  error(message: string, meta?: any): void {
    if (meta) {
      console.error(`${this.prefix}❌ ${message}`, meta);
    } else {
      console.error(`${this.prefix}❌ ${message}`);
    }
  }
}

/**
 * 後端logger包裝 - 使用winston
 */
class BackendLoggerWrapper implements ILogger {
  private logger: any;

  constructor(logger: any) {
    this.logger = logger;
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }
}

// 創建適合當前環境的logger實例
const createLogger = (prefix?: string): ILogger => {
  if (isBackend && backendLogger) {
    return new BackendLoggerWrapper(backendLogger);
  }
  return new FrontendLogger(prefix);
};

// 創建適合當前環境的業務logger實例
const createBusinessLogger = (prefix?: string): ILogger => {
  if (isBackend && backendBusinessLogger) {
    return new BackendLoggerWrapper(backendBusinessLogger);
  }
  return new FrontendLogger(prefix || 'Business');
};

// 默認logger實例
export const logger = createLogger();

// 業務logger實例
export const businessLogger = createBusinessLogger();

export default logger;