/**
 * 後端 API 回應輔助函數
 */

import { Response } from 'express';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';

/**
 * 創建成功回應
 * @param message 成功訊息
 * @param data 回應資料
 * @returns API 回應物件
 */
export function createSuccessResponse<T>(message: string, data: T): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date()
  };
}

/**
 * 創建錯誤回應
 * @param message 錯誤訊息
 * @param error 錯誤詳情（可選）
 * @returns 錯誤回應物件
 */
export function createErrorResponse(message: string, error?: string): ErrorResponse {
  return {
    success: false,
    message,
    error,
    timestamp: new Date()
  };
}

/**
 * 發送成功回應
 * @param res Express 回應物件
 * @param message 成功訊息
 * @param data 回應資料
 * @param statusCode HTTP 狀態碼（預設 200）
 */
export function sendSuccessResponse<T>(
  res: Response,
  message: string,
  data: T,
  statusCode: number = API_CONSTANTS.HTTP_STATUS.OK
): void {
  res.status(statusCode).json(createSuccessResponse(message, data));
}

/**
 * 發送錯誤回應
 * @param res Express 回應物件
 * @param message 錯誤訊息
 * @param statusCode HTTP 狀態碼
 * @param error 錯誤詳情（可選）
 */
export function sendErrorResponse(
  res: Response,
  message: string,
  statusCode: number,
  error?: string
): void {
  res.status(statusCode).json(createErrorResponse(message, error));
}

/**
 * 發送驗證失敗回應
 * @param res Express 回應物件
 * @param errors 驗證錯誤陣列
 */
export function sendValidationErrorResponse(res: Response, errors: any[]): void {
  sendErrorResponse(
    res,
    ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
    API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
    JSON.stringify(errors)
  );
}

/**
 * 發送無效請求回應
 * @param res Express 回應物件
 * @param message 錯誤訊息（可選）
 */
export function sendInvalidRequestResponse(res: Response, message?: string): void {
  sendErrorResponse(
    res,
    message || ERROR_MESSAGES.GENERIC.INVALID_REQUEST,
    API_CONSTANTS.HTTP_STATUS.BAD_REQUEST
  );
}

/**
 * 發送資源不存在回應
 * @param res Express 回應物件
 * @param message 錯誤訊息
 */
export function sendNotFoundResponse(res: Response, message: string): void {
  sendErrorResponse(
    res,
    message,
    API_CONSTANTS.HTTP_STATUS.NOT_FOUND
  );
}

/**
 * 發送伺服器錯誤回應
 * @param res Express 回應物件
 * @param error 錯誤物件（可選）
 */
export function sendServerErrorResponse(res: Response, error?: any): void {
  if (error) {
    console.error(error.message || error);
  }
  
  sendErrorResponse(
    res,
    ERROR_MESSAGES.GENERIC.SERVER_ERROR,
    API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
}

/**
 * 處理 ObjectId 錯誤
 * @param res Express 回應物件
 * @param error 錯誤物件
 * @param notFoundMessage 資源不存在訊息
 */
export function handleObjectIdError(res: Response, error: any, notFoundMessage: string): void {
  if (error.kind === 'ObjectId') {
    sendNotFoundResponse(res, notFoundMessage);
  } else {
    sendServerErrorResponse(res, error);
  }
}

/**
 * 驗證請求參數 ID
 * @param res Express 回應物件
 * @param id 請求參數 ID
 * @param invalidMessage 無效 ID 訊息（可選）
 * @returns 是否有效
 */
export function validateRequestId(res: Response, id: string | undefined, invalidMessage?: string): boolean {
  if (!id) {
    sendInvalidRequestResponse(res, invalidMessage);
    return false;
  }
  return true;
}

/**
 * 安全轉換為字串
 * @param value 要轉換的值
 * @returns 字串值
 */
export function safeToString(value: any): string {
  return value?.toString() || '';
}

/**
 * 建立欄位更新物件（只更新非 undefined 的欄位）
 * @param source 來源物件
 * @param fieldMappings 欄位映射（key: 來源欄位名, value: 目標欄位名）
 * @returns 更新欄位物件
 */
export function createUpdateFields<T>(
  source: any,
  fieldMappings: Record<string, string> = {}
): Partial<T> {
  const updateFields: Partial<T> = {};
  
  Object.keys(source).forEach(key => {
    if (source[key] !== undefined) {
      const targetKey = fieldMappings[key] || key;
      (updateFields as any)[targetKey] = safeToString(source[key]);
    }
  });
  
  return updateFields;
}