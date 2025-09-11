import { Response } from 'express';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@pharmacy-pos/shared/constants';
import logger from '../../../utils/logger';

/**
 * 創建標準 API 成功響應
 * @param data - 響應數據
 * @param message - 響應消息
 */
export function createSuccessResponse<T>(data: T, message: string = SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date()
  };
}

/**
 * 創建標準錯誤響應
 * @param message - 錯誤消息
 * @param errors - 驗證錯誤數組（可選）
 */
export function createErrorResponse(message: string, errors?: any[]): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date()
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return response;
}

/**
 * 處理數據庫錯誤並發送響應
 * @param res - Express 響應對象
 * @param err - 錯誤對象
 * @param customMessage - 自定義錯誤消息（可選）
 */
export function handleDatabaseError(res: Response, err: Error, customMessage?: string): void {
  logger.error(`資料庫錯誤: ${err.message}`);
  
  if (err.name === 'CastError') {
    res.status(404).json(createErrorResponse(customMessage || ERROR_MESSAGES.GENERIC.NOT_FOUND));
    return;
  }
  
  res.status(500).json(createErrorResponse(ERROR_MESSAGES.GENERIC.SERVER_ERROR));
}