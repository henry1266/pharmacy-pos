/**
 * 套餐相關類型定義
 */

// 套餐項目介面
export interface PackageItem {
  productId: string;        // 產品 ID
  productCode: string;      // 產品代碼
  productName: string;      // 產品名稱
  quantity: number;         // 數量
  unitPrice?: number;       // 單價（可選，用於單價模式）
  subtotal: number;         // 小計（必填，可手動輸入或自動計算）
  unit: string;            // 單位
  priceMode: 'unit' | 'subtotal'; // 價格模式：單價模式或小計模式
}

// 套餐介面
export interface Package {
  _id?: string;            // MongoDB ID
  id?: string;             // 前端使用的 ID
  code: string;            // 套餐編號 (T10001, T10002...) - 系統自動生成
  shortCode?: string;      // 套餐簡碼 - 用戶手動輸入
  name: string;            // 套餐名稱
  description?: string;    // 套餐描述
  items: PackageItem[];    // 套餐包含的產品項目
  totalPrice: number;      // 套餐總價（各項目小計的加總）
  isActive: boolean;       // 是否啟用
  category?: string;       // 套餐分類
  tags?: string[];         // 標籤
  createdAt: Date;         // 建立時間
  updatedAt: Date;         // 更新時間
  createdBy?: string;      // 建立者
  updatedBy?: string;      // 更新者
}

// 套餐篩選條件
export interface PackageFilters {
  search?: string;         // 搜尋關鍵字（套餐名稱、代碼）
  category?: string;       // 分類篩選
  isActive?: boolean;      // 啟用狀態篩選
  minPrice?: number;       // 最低價格
  maxPrice?: number;       // 最高價格
  tags?: string[];         // 標籤篩選
}

// 套餐建立/更新請求
export interface PackageCreateRequest {
  name: string;
  shortCode?: string;
  description?: string;
  items: PackageItem[];
  tags?: string[];
  isActive?: boolean;
}

export interface PackageUpdateRequest extends PackageCreateRequest {
  id: string;
}

// 套餐統計資訊
export interface PackageStats {
  totalPackages: number;
  activePackages: number;
  inactivePackages: number;
  totalValue: number;
  averageDiscount: number;
}