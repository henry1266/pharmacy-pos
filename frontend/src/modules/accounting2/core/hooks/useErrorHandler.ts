/**
 * 統一錯誤處理 Hook
 * 提供錯誤處理、通知顯示和重試機制
 */

import { useState, useCallback } from 'react';
import { ErrorHandler, AppError, ErrorType } from '../errors/ErrorHandler';

// 通知狀態介面
interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  actions?: Array<{ label: string; action: () => void }>;
}

// Hook 回傳值介面
interface UseErrorHandlerReturn {
  // 錯誤狀態
  error: AppError | null;
  hasError: boolean;
  
  // 通知狀態
  notification: NotificationState;
  
  // 錯誤處理函數
  handleError: (error: any, context?: Record<string, any>) => void;
  clearError: () => void;
  
  // 通知函數
  showNotification: (message: string, severity: NotificationState['severity'], title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  closeNotification: () => void;
  
  // 重試機制
  retry: (retryFn: () => Promise<void> | void) => Promise<void>;
  isRetrying: boolean;
}

/**
 * 錯誤處理 Hook
 */
export const useErrorHandler = (): UseErrorHandlerReturn => {
  // 錯誤狀態
  const [error, setError] = useState<AppError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // 通知狀態
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info'
  });

  /**
   * 處理錯誤
   */
  const handleError = useCallback((rawError: any, context?: Record<string, any>) => {
    const appError = ErrorHandler.handleError(rawError, context);
    
    // 記錄錯誤
    ErrorHandler.logError(appError);
    
    // 設定錯誤狀態
    setError(appError);
    
    // 顯示錯誤通知
    const displayError = ErrorHandler.formatErrorForDisplay(appError);
    setNotification({
      open: true,
      message: displayError.message,
      severity: displayError.severity,
      title: displayError.title,
      actions: displayError.actions
    });
  }, []);

  /**
   * 清除錯誤
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 顯示通知
   */
  const showNotification = useCallback((
    message: string, 
    severity: NotificationState['severity'], 
    title?: string
  ) => {
    setNotification({
      open: true,
      message,
      severity,
      title
    });
  }, []);

  /**
   * 顯示成功通知
   */
  const showSuccess = useCallback((message: string, title?: string) => {
    showNotification(message, 'success', title || '操作成功');
  }, [showNotification]);

  /**
   * 顯示警告通知
   */
  const showWarning = useCallback((message: string, title?: string) => {
    showNotification(message, 'warning', title || '注意');
  }, [showNotification]);

  /**
   * 顯示資訊通知
   */
  const showInfo = useCallback((message: string, title?: string) => {
    showNotification(message, 'info', title || '提示');
  }, [showNotification]);

  /**
   * 關閉通知
   */
  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  /**
   * 重試機制
   */
  const retry = useCallback(async (retryFn: () => Promise<void> | void) => {
    if (!error?.retryable) {
      console.warn('當前錯誤不支援重試');
      return;
    }

    try {
      setIsRetrying(true);
      clearError();
      closeNotification();
      
      await retryFn();
      
      showSuccess('重試成功');
    } catch (retryError) {
      handleError(retryError, { isRetry: true, originalError: error });
    } finally {
      setIsRetrying(false);
    }
  }, [error, clearError, closeNotification, showSuccess, handleError]);

  return {
    // 錯誤狀態
    error,
    hasError: error !== null,
    
    // 通知狀態
    notification,
    
    // 錯誤處理函數
    handleError,
    clearError,
    
    // 通知函數
    showNotification,
    showSuccess,
    showWarning,
    showInfo,
    closeNotification,
    
    // 重試機制
    retry,
    isRetrying
  };
};

/**
 * 錯誤處理 Hook 的簡化版本（僅處理錯誤，不包含通知）
 */
export const useSimpleErrorHandler = () => {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((rawError: any, context?: Record<string, any>) => {
    const appError = ErrorHandler.handleError(rawError, context);
    ErrorHandler.logError(appError);
    setError(appError.userMessage);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    hasError: error !== null,
    handleError,
    clearError
  };
};

export default useErrorHandler;