/**
 * 會計型別轉換工具
 * 處理前後端之間的資料格式轉換
 */

import type { AccountingItem } from '../types/accounting';

/**
 * 後端會計項目介面（避免循環依賴）
 */
export interface BackendAccountingItem {
  amount: number;
  category: string;
  categoryId?: string; // 在轉換時處理 ObjectId
  notes?: string;
}

/**
 * 將前端 AccountingItem 轉換為後端格式
 */
export const toBackendAccountingItem = (frontendItem: AccountingItem): BackendAccountingItem => {
  const result: BackendAccountingItem = {
    amount: typeof frontendItem.amount === 'string' ? parseFloat(frontendItem.amount) : frontendItem.amount,
    category: frontendItem.category
  };
  
  if (frontendItem.categoryId) {
    result.categoryId = frontendItem.categoryId;
  }
  
  if (frontendItem.notes) {
    result.notes = frontendItem.notes;
  }
  
  return result;
};

/**
 * 將後端格式轉換為前端 AccountingItem
 */
export const toFrontendAccountingItem = (backendItem: BackendAccountingItem): AccountingItem => {
  const result: AccountingItem = {
    amount: backendItem.amount,
    category: backendItem.category
  };
  
  if (backendItem.categoryId) {
    result.categoryId = backendItem.categoryId;
  }
  
  if (backendItem.notes) {
    result.notes = backendItem.notes;
  }
  
  return result;
};

/**
 * 批量轉換前端項目為後端項目
 */
export const toBackendAccountingItems = (frontendItems: AccountingItem[]): BackendAccountingItem[] => {
  return frontendItems.map(toBackendAccountingItem);
};

/**
 * 批量轉換後端項目為前端項目
 */
export const toFrontendAccountingItems = (backendItems: BackendAccountingItem[]): AccountingItem[] => {
  return backendItems.map(toFrontendAccountingItem);
};

/**
 * 驗證會計項目資料格式
 */
export const validateAccountingItem = (item: AccountingItem): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (typeof item.amount !== 'number' || item.amount < 0) {
    errors.push('金額必須為正數');
  }

  if (!item.category || item.category.trim() === '') {
    errors.push('類別不能為空');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 批量驗證會計項目
 */
export const validateAccountingItems = (items: AccountingItem[]): { isValid: boolean; errors: string[] } => {
  const allErrors: string[] = [];

  items.forEach((item, index) => {
    const validation = validateAccountingItem(item);
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        allErrors.push(`項目 ${index + 1}: ${error}`);
      });
    }
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};