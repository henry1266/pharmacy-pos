/**
 * Accounting2 核心模組統一導出
 * 提供錯誤處理、通知、API 客戶端等核心功能
 */

// 錯誤處理
export { ErrorHandler, ErrorType, ErrorSeverity } from './errors/ErrorHandler';
export type { AppError } from './errors/ErrorHandler';

// 錯誤處理 Hook
export { useErrorHandler, useSimpleErrorHandler } from './hooks/useErrorHandler';

// 優化 Hook
export { useOptimizedAccountList } from './hooks/useOptimizedAccountList';

// 錯誤邊界組件
export { 
  ErrorBoundary, 
  AccountingErrorBoundary, 
  withErrorBoundary 
} from './components/ErrorBoundary';

// 通知系統
export { 
  NotificationProvider, 
  useNotification, 
  withNotification 
} from './components/NotificationProvider';

// API 客戶端
export * from './api-clients';

// 服務層
export { AccountService } from './services/AccountService';