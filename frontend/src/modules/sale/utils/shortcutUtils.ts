/**
 * @file 快捷按鈕工具函數
 * @description 提供快捷按鈕相關的工具函數
 */

import { Product } from '@pharmacy-pos/shared/types/entities';
import { UserShortcut, ShortcutValidationResult } from '../types';

/**
 * 驗證快捷按鈕中的商品和套餐是否存在
 * 
 * @param shortcut - 要驗證的快捷按鈕
 * @param allProducts - 所有可用的產品列表
 * @param allPackages - 所有可用的套餐列表
 * @param showSnackbar - 顯示通知的函數
 * @returns 驗證結果，包含是否有效及有效的產品/套餐ID列表
 */
export const validateShortcutItems = (
  shortcut: UserShortcut, 
  allProducts: Product[], 
  allPackages: any[],
  showSnackbar: (message: string, severity?: 'success' | 'info' | 'warning' | 'error') => void
): ShortcutValidationResult => {
  const hasProducts = shortcut?.productIds && shortcut.productIds.length > 0;
  const hasPackages = shortcut?.packageIds && shortcut.packageIds.length > 0;
  
  if (!hasProducts && !hasPackages) {
    console.warn("Selected shortcut has no product or package IDs");
    showSnackbar('此快捷按鈕沒有包含任何商品或套餐', 'warning');
    return { isValid: false, validProductIds: [], validPackageIds: [] };
  }

  let validProductIds: string[] = [];
  let validPackageIds: string[] = [];

  // 驗證產品
  if (hasProducts) {
    if (!allProducts || allProducts.length === 0) {
      console.warn("Products not loaded yet");
      showSnackbar('產品資料尚未載入完成，請稍後再試', 'warning');
      return { isValid: false, validProductIds: [], validPackageIds: [] };
    }

    validProductIds = shortcut.productIds!.filter(id =>
      allProducts.some(p => p._id === id)
    );
  }

  // 驗證套餐
  if (hasPackages) {
    if (!allPackages || allPackages.length === 0) {
      console.warn("Packages not loaded yet");
      showSnackbar('套餐資料尚未載入完成，請稍後再試', 'warning');
      return { isValid: false, validProductIds: [], validPackageIds: [] };
    }

    // 使用統一的 ID 獲取函數來比較套餐
    const getItemId = (item: any): string => {
      if (item._id) {
        if (typeof item._id === 'string') {
          return item._id;
        } else if (typeof item._id === 'object' && item._id.$oid) {
          return item._id.$oid;
        }
      }
      return item.code || '';
    };

    validPackageIds = shortcut.packageIds!.filter(id =>
      allPackages.some(pkg => getItemId(pkg) === id)
    );
  }

  const totalValidItems = validProductIds.length + validPackageIds.length;
  const totalItems = (shortcut.productIds?.length || 0) + (shortcut.packageIds?.length || 0);

  if (totalValidItems === 0) {
    console.warn("None of the shortcut items match available products or packages");
    showSnackbar('找不到此快捷按鈕中的任何商品或套餐', 'error');
    return { isValid: false, validProductIds: [], validPackageIds: [] };
  }

  if (totalValidItems < totalItems) {
    console.warn(`Only ${totalValidItems} of ${totalItems} items found`);
    showSnackbar(`只找到 ${totalValidItems} 個項目，部分商品或套餐可能已不存在`, 'warning');
  }
  
  return { isValid: true, validProductIds, validPackageIds };
};

/**
 * 獲取項目的唯一ID
 * 
 * @param item - 要獲取ID的項目
 * @returns 項目的唯一ID
 */
export const getItemId = (item: any): string => {
  if (item._id) {
    if (typeof item._id === 'string') {
      return item._id;
    } else if (typeof item._id === 'object' && item._id.$oid) {
      return item._id.$oid;
    }
  }
  return item.code || '';
};