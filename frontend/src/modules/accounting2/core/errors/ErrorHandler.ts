/**
 * 統一錯誤處理工具類
 * 提供錯誤分類、格式化和處理策略
 */

// 錯誤類型枚舉
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN'
}

// 錯誤嚴重程度
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// 統一錯誤介面
export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: Date;
  userMessage: string;
  actionable: boolean;
  retryable: boolean;
}

/**
 * 錯誤處理工具類
 */
export class ErrorHandler {
  /**
   * 分析錯誤類型
   */
  static analyzeError(error: any): ErrorType {
    if (!error) return ErrorType.UNKNOWN;

    // 網路錯誤
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      return ErrorType.NETWORK;
    }

    // HTTP 狀態碼錯誤
    if (error.response?.status) {
      const status = error.response.status;
      if (status === 401) return ErrorType.AUTHENTICATION;
      if (status === 403) return ErrorType.AUTHORIZATION;
      if (status === 404) return ErrorType.NOT_FOUND;
      if (status >= 400 && status < 500) return ErrorType.VALIDATION;
      if (status >= 500) return ErrorType.SERVER_ERROR;
    }

    // 驗證錯誤
    if (error.name === 'ValidationError' || error.message?.includes('validation')) {
      return ErrorType.VALIDATION;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * 判斷錯誤嚴重程度
   */
  static getSeverity(errorType: ErrorType): ErrorSeverity {
    switch (errorType) {
      case ErrorType.NETWORK:
        return ErrorSeverity.MEDIUM;
      case ErrorType.VALIDATION:
        return ErrorSeverity.LOW;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return ErrorSeverity.HIGH;
      case ErrorType.NOT_FOUND:
        return ErrorSeverity.LOW;
      case ErrorType.SERVER_ERROR:
        return ErrorSeverity.HIGH;
      case ErrorType.UNKNOWN:
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * 生成用戶友好的錯誤訊息
   */
  static getUserMessage(errorType: ErrorType, originalMessage?: string): string {
    switch (errorType) {
      case ErrorType.NETWORK:
        return '網路連線異常，請檢查網路狀態後重試';
      case ErrorType.VALIDATION:
        return originalMessage || '輸入資料格式不正確，請檢查後重新輸入';
      case ErrorType.AUTHENTICATION:
        return '登入已過期，請重新登入';
      case ErrorType.AUTHORIZATION:
        return '您沒有執行此操作的權限';
      case ErrorType.NOT_FOUND:
        return '找不到相關資料';
      case ErrorType.SERVER_ERROR:
        return '伺服器發生錯誤，請稍後再試';
      case ErrorType.UNKNOWN:
      default:
        return originalMessage || '發生未知錯誤，請聯繫系統管理員';
    }
  }

  /**
   * 判斷錯誤是否可重試
   */
  static isRetryable(errorType: ErrorType): boolean {
    return [
      ErrorType.NETWORK,
      ErrorType.SERVER_ERROR
    ].includes(errorType);
  }

  /**
   * 判斷錯誤是否需要用戶操作
   */
  static isActionable(errorType: ErrorType): boolean {
    return [
      ErrorType.VALIDATION,
      ErrorType.AUTHENTICATION,
      ErrorType.AUTHORIZATION
    ].includes(errorType);
  }

  /**
   * 處理錯誤並轉換為統一格式
   */
  static handleError(error: any, context?: Record<string, any>): AppError {
    const type = this.analyzeError(error);
    const severity = this.getSeverity(type);
    const originalMessage = error?.message || error?.response?.data?.message || '未知錯誤';
    const userMessage = this.getUserMessage(type, originalMessage);

    return {
      type,
      severity,
      message: originalMessage,
      originalError: error instanceof Error ? error : new Error(String(error)),
      context,
      timestamp: new Date(),
      userMessage,
      actionable: this.isActionable(type),
      retryable: this.isRetryable(type)
    };
  }

  /**
   * 記錄錯誤（可擴展為發送到監控系統）
   */
  static logError(appError: AppError): void {
    const logLevel = this.getLogLevel(appError.severity);
    const logData = {
      type: appError.type,
      severity: appError.severity,
      message: appError.message,
      userMessage: appError.userMessage,
      context: appError.context,
      timestamp: appError.timestamp.toISOString(),
      stack: appError.originalError?.stack
    };

    switch (logLevel) {
      case 'error':
        console.error('🚨 [ERROR]', logData);
        break;
      case 'warn':
        console.warn('⚠️ [WARN]', logData);
        break;
      case 'info':
      default:
        console.info('ℹ️ [INFO]', logData);
        break;
    }

    // 未來可擴展：發送到錯誤監控服務
    // this.sendToMonitoring(appError);
  }

  /**
   * 獲取日誌級別
   */
  private static getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
      default:
        return 'info';
    }
  }

  /**
   * 格式化錯誤用於顯示
   */
  static formatErrorForDisplay(appError: AppError): {
    title: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    actions?: Array<{ label: string; action: () => void }>;
  } {
    const severity = appError.severity === ErrorSeverity.LOW ? 'info' : 
                    appError.severity === ErrorSeverity.MEDIUM ? 'warning' : 'error';

    return {
      title: this.getErrorTitle(appError.type),
      message: appError.userMessage,
      severity,
      actions: appError.retryable ? [
        { label: '重試', action: () => window.location.reload() }
      ] : undefined
    };
  }

  /**
   * 獲取錯誤標題
   */
  private static getErrorTitle(errorType: ErrorType): string {
    switch (errorType) {
      case ErrorType.NETWORK:
        return '網路錯誤';
      case ErrorType.VALIDATION:
        return '資料驗證錯誤';
      case ErrorType.AUTHENTICATION:
        return '身份驗證錯誤';
      case ErrorType.AUTHORIZATION:
        return '權限錯誤';
      case ErrorType.NOT_FOUND:
        return '資料不存在';
      case ErrorType.SERVER_ERROR:
        return '伺服器錯誤';
      case ErrorType.UNKNOWN:
      default:
        return '系統錯誤';
    }
  }
}

export default ErrorHandler;