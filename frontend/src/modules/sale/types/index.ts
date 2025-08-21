/**
 * @file 銷售模組類型定義
 * @description 定義銷售模組中使用的各種類型
 */

import { Product, Customer } from '@pharmacy-pos/shared/types/entities';
import { type UserShortcut } from '@/hooks/useUserSettings';

/**
 * 通知訊息狀態介面
 * @interface SnackbarState
 */
export interface SnackbarState {
  /** 是否顯示通知 */
  open: boolean;
  /** 通知訊息內容 */
  message: string;
  /** 通知訊息類型 */
  severity: 'success' | 'info' | 'warning' | 'error';
}

/**
 * 銷售完成後的資料介面
 * @interface SaleCompletionData
 */
export interface SaleCompletionData {
  /** 銷售總金額 */
  totalAmount: number;
  /** 銷售單號 */
  saleNumber: string;
}

/**
 * 快捷按鈕項目驗證結果介面
 * @interface ShortcutValidationResult
 */
export interface ShortcutValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 有效的產品ID列表 */
  validProductIds: string[];
  /** 有效的套餐ID列表 */
  validPackageIds: string[];
}

/**
 * 從原始檔案導出的類型，用於保持類型一致性
 */
export type { UserShortcut, Product, Customer };