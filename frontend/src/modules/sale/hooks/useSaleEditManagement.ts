/**
 * 銷售編輯管理 Hook (向後兼容版本)
 *
 * 這個版本是為了向後兼容而保留的，實際使用新的 useSaleEdit hook
 *
 * @deprecated 請使用 useSaleEdit hook
 */
import { Product } from '@pharmacy-pos/shared/types/entities';
import { SaleData } from '../types/edit';
import { useSaleEdit } from './useSaleEdit';

/**
 * 銷售編輯管理 Hook
 * 用於管理銷售編輯的狀態和操作
 *
 * @param _initialSaleData 初始銷售數據 (不再使用，保留參數是為了向後兼容)
 * @param products 產品列表
 * @param saleId 銷售記錄ID
 * @returns 銷售編輯的狀態和操作函數
 */
export const useSaleEditManagement = (
  _initialSaleData: SaleData | null,
  products: Product[],
  saleId: string
) => {
  // 使用新的 hook
  const {
    currentSale,
    barcode,
    inputModes,
    handleBarcodeChange,
    handleBarcodeSubmit,
    handleInputChange,
    handleQuantityChange,
    handlePriceChange,
    handlePriceBlur,
    handleSubtotalChange,
    toggleInputMode,
    handleRemoveItem,
    handleUpdateSale,
    snackbar,
    handleCloseSnackbar
  } = useSaleEdit(saleId, products);

  // 返回與原始 hook 相同的介面
  return {
    currentSale,
    barcode,
    inputModes,
    handleBarcodeChange,
    handleBarcodeSubmit,
    handleInputChange,
    handleQuantityChange,
    handlePriceChange,
    handlePriceBlur,
    handleSubtotalChange,
    toggleInputMode,
    handleRemoveItem,
    handleUpdateSale,
    snackbar,
    handleCloseSnackbar
  };
};