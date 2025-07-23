/**
 * 採購訂單相關型別定義
 * 統一前後端使用的型別，避免不一致問題
 */

// 採購訂單狀態枚舉
export type PurchaseOrderStatus = 'pending' | 'completed' | 'cancelled';
export type PaymentStatus = '未付' | '已下收' | '已匯款';

/**
 * 採購訂單項目介面
 * 統一使用 dquantity 和 dtotalCost 命名
 */
export interface PurchaseOrderItem {
  _id?: string;
  product: string; // 產品ID（字符串形式，適用於前後端）
  did: string; // 產品代碼
  dname: string; // 產品名稱
  dquantity: number; // 數量
  dtotalCost: number; // 總成本
  unitPrice?: number; // 單價（自動計算或手動設置）
  receivedQuantity?: number; // 已收貨數量
  batchNumber?: string; // 批號（選填）
  notes?: string; // 備註
}

/**
 * 採購訂單介面
 * 統一前後端使用的完整採購訂單結構
 */
export interface PurchaseOrder {
  _id: string;
  poid: string; // 進貨單號
  orderNumber: string; // 系統訂單號
  pobill?: string; // 發票號碼
  pobilldate?: string | Date; // 發票日期
  posupplier: string; // 供應商名稱
  supplier?: string; // 供應商ID
  orderDate?: string | Date; // 訂單日期（向後兼容）
  expectedDeliveryDate?: string | Date; // 預期交貨日期
  actualDeliveryDate?: string | Date; // 實際交貨日期
  items: PurchaseOrderItem[]; // 採購項目
  totalAmount: number; // 總金額
  status: PurchaseOrderStatus; // 訂單狀態
  paymentStatus: PaymentStatus; // 付款狀態
  notes?: string; // 備註
  createdBy?: string; // 創建者ID
  createdAt: string | Date; // 創建時間
  updatedAt: string | Date; // 更新時間
}

/**
 * 前端表單使用的採購訂單資料結構
 * 包含前端特有的欄位和格式
 */
export interface PurchaseOrderFormData {
  poid: string;
  pobill: string;
  pobilldate: Date;
  posupplier: string; // 供應商名稱
  supplier: string; // 供應商ID
  items: PurchaseOrderItem[];
  notes: string;
  status: string;
  paymentStatus: string;
  multiplierMode: string | number; // 倍率模式
}

/**
 * API 請求用的採購訂單資料
 * 用於新增和更新採購訂單
 */
export interface PurchaseOrderRequest {
  poid?: string;
  pobill?: string;
  pobilldate?: Date | string;
  posupplier: string;
  supplier?: string;
  items: PurchaseOrderItem[];
  notes?: string;
  status?: PurchaseOrderStatus;
  paymentStatus?: PaymentStatus;
}

/**
 * 採購訂單列表項目
 * 用於列表顯示的簡化版本
 */
export interface PurchaseOrderListItem {
  _id: string;
  poid: string;
  orderNumber: string;
  pobill?: string;
  pobilldate?: string | Date;
  posupplier: string;
  totalAmount: number;
  status: PurchaseOrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string | Date;
}

/**
 * 採購訂單搜尋參數
 */
export interface PurchaseOrderSearchParams {
  poid?: string;
  pobill?: string;
  posupplier?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  status?: PurchaseOrderStatus;
  paymentStatus?: PaymentStatus;
}

/**
 * 型別守衛函數
 */
export function isPurchaseOrder(obj: any): obj is PurchaseOrder {
  return obj && 
         typeof obj._id === 'string' &&
         typeof obj.poid === 'string' &&
         typeof obj.orderNumber === 'string' &&
         typeof obj.posupplier === 'string' &&
         Array.isArray(obj.items) &&
         typeof obj.totalAmount === 'number' &&
         typeof obj.status === 'string' &&
         typeof obj.paymentStatus === 'string';
}

export function isPurchaseOrderItem(obj: any): obj is PurchaseOrderItem {
  return obj &&
         typeof obj.product === 'string' &&
         typeof obj.did === 'string' &&
         typeof obj.dname === 'string' &&
         typeof obj.dquantity === 'number' &&
         typeof obj.dtotalCost === 'number';
}