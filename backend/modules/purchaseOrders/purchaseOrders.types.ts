import { IPurchaseOrderDocument, IPurchaseOrderItemDocument, PurchaseOrderStatus as ModelPurchaseOrderStatus, PaymentStatus as ModelPaymentStatus } from '../../models/PurchaseOrder';
import { PurchaseOrderRequest, PurchaseOrderStatus } from '@pharmacy-pos/shared/types/purchase-order';

// 驗證結果介面
export interface ValidationResult {
  valid: boolean;
  message?: string;
  processedItems?: any;
  error?: string;
}

// 進貨單ID變更處理結果介面
export interface PurchaseOrderIdChangeResult {
  success: boolean;
  error?: string;
  orderNumber?: string;
}

// 狀態變更處理結果介面
export interface StatusChangeResult {
  statusChanged: boolean;
  status?: string;
  inventoryDeleted?: boolean;
  needUpdateInventory?: boolean;
  accountingEntriesDeleted?: boolean;
}

// 進貨單驗證結果介面
export interface PurchaseOrderValidationResult {
  valid: boolean;
  purchaseOrder?: IPurchaseOrderDocument;
  error?: string;
}

// 重新導出相關型別，方便其他模組使用
export {
  IPurchaseOrderDocument,
  IPurchaseOrderItemDocument,
  ModelPurchaseOrderStatus,
  ModelPaymentStatus,
  PurchaseOrderRequest,
  PurchaseOrderStatus
};