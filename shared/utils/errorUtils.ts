/**
 * 錯誤處理工具函數
 * 提供統一的錯誤處理和格式化功能
 */

/**
 * API 錯誤介面
 */
export interface ApiError {
  message: string;
  code?: string | number;
  details?: any;
}

/**
 * 處理 API 錯誤
 * @param error 錯誤物件
 * @returns 錯誤訊息
 */
export const handleApiError = (error: any): string => {
  // 檢查是否為 Axios 錯誤格式
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // 檢查是否有標準錯誤訊息
  if (error.message) {
    return error.message;
  }
  
  // 檢查是否為字串錯誤
  if (typeof error === 'string') {
    return error;
  }
  
  // 預設錯誤訊息
  return '發生未知錯誤';
};

/**
 * 格式化錯誤物件
 * @param error 錯誤物件
 * @returns 格式化後的錯誤物件
 */
export const formatError = (error: any): ApiError => {
  return {
    message: handleApiError(error),
    code: error.response?.status || error.code,
    details: error.response?.data || error.details
  };
};

/**
 * 檢查是否為網路錯誤
 * @param error 錯誤物件
 * @returns 是否為網路錯誤
 */
export const isNetworkError = (error: any): boolean => {
  return error.code === 'NETWORK_ERROR' || 
         error.message?.includes('Network Error') ||
         !error.response;
};

/**
 * 檢查是否為認證錯誤
 * @param error 錯誤物件
 * @returns 是否為認證錯誤
 */
export const isAuthError = (error: any): boolean => {
  return error.response?.status === 401 || 
         error.response?.status === 403;
};

/**
 * 檢查是否為驗證錯誤
 * @param error 錯誤物件
 * @returns 是否為驗證錯誤
 */
export const isValidationError = (error: any): boolean => {
  return error.response?.status === 400 ||
         error.response?.status === 422;
};

/**
 * 記錄錯誤到控制台（開發環境）
 * @param error 錯誤物件
 * @param context 錯誤上下文
 */
export const logError = (error: any, context?: string): void => {
  if (process.env.NODE_ENV === 'development') {
    const errorPrefix = context ? `[Error - ${context}]` : '[Error]';
    console.error(`${errorPrefix}:`, error);
  }
};