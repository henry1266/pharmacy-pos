/**
 * Dashboard API DTO (Data Transfer Objects)
 * 定義 Request/Response 型別
 */
import { 
  PurchaseOrder, 
  ShippingOrder, 
  Sale, 
  AccountingRecord 
} from '@pharmacy-pos/shared/types/entities';
import { ExtendedAccountingRecord, FormData } from '@pharmacy-pos/shared/types/accounting';

/**
 * 通用分頁響應介面
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 通用響應介面
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * 日期統計數據 DTO
 */
export interface DailyStatsDto {
  /** 日期字符串 */
  date: string;
  /** 進貨總金額 */
  purchaseTotal: number;
  /** 進貨數量 */
  purchaseCount: number;
  /** 進貨記錄列表 */
  purchaseRecords: PurchaseOrder[];
  /** 出貨總金額 */
  shippingTotal: number;
  /** 出貨數量 */
  shippingCount: number;
  /** 出貨記錄列表 */
  shippingRecords: ShippingOrder[];
}

/**
 * 日期統計查詢參數
 */
export interface DailyStatsQueryParams {
  /** 目標日期，格式為 'YYYY-MM-DD' */
  date: string;
}

/**
 * 銷售儀表板數據 DTO
 */
export interface SalesDashboardDto {
  /** 銷售記錄列表 */
  salesRecords: Sale[];
  /** 銷售總金額 */
  salesTotal: number;
  /** 銷售數量 */
  salesCount: number;
}

/**
 * 銷售儀表板查詢參數
 */
export interface SalesDashboardQueryParams {
  /** 開始日期，格式為 'YYYY-MM-DD' */
  startDate?: string;
  /** 結束日期，格式為 'YYYY-MM-DD' */
  endDate?: string;
  /** 搜索關鍵詞 */
  search?: string | undefined;
}

/**
 * 記帳儀表板數據 DTO
 */
export interface AccountingDashboardDto {
  /** 記帳記錄列表 */
  accountingRecords: ExtendedAccountingRecord[];
  /** 記帳總金額 */
  accountingTotal: number;
}

/**
 * 記帳儀表板查詢參數
 */
export interface AccountingDashboardQueryParams {
  /** 開始日期，格式為 'YYYY-MM-DD' */
  startDate?: string;
  /** 結束日期，格式為 'YYYY-MM-DD' */
  endDate?: string;
}

/**
 * 更新記帳記錄請求 DTO
 */
export interface UpdateAccountingRecordDto {
  /** 記帳記錄 ID */
  id: string;
  /** 記帳記錄數據 */
  data: Partial<AccountingRecord>;
}

/**
 * 儀表板統計數據 DTO
 */
export interface DashboardStatsDto {
  /** 今日銷售總金額 */
  todaySalesTotal: number;
  /** 今日銷售數量 */
  todaySalesCount: number;
  /** 今日進貨總金額 */
  todayPurchaseTotal: number;
  /** 今日進貨數量 */
  todayPurchaseCount: number;
  /** 今日出貨總金額 */
  todayShippingTotal: number;
  /** 今日出貨數量 */
  todayShippingCount: number;
  /** 今日記帳總金額 */
  todayAccountingTotal: number;
  /** 本月銷售總金額 */
  monthSalesTotal: number;
  /** 本月銷售數量 */
  monthSalesCount: number;
}

/**
 * 將原始日期統計數據轉換為 DailyStatsDto
 */
export const mapToDailyStatsDto = (data: any): DailyStatsDto => {
  return {
    date: data.date || '',
    purchaseTotal: data.purchaseTotal || 0,
    purchaseCount: data.purchaseCount || 0,
    purchaseRecords: data.purchaseRecords || [],
    shippingTotal: data.shippingTotal || 0,
    shippingCount: data.shippingCount || 0,
    shippingRecords: data.shippingRecords || []
  };
};

/**
 * 將原始銷售儀表板數據轉換為 SalesDashboardDto
 */
export const mapToSalesDashboardDto = (data: any): SalesDashboardDto => {
  const salesRecords = data.salesRecords || [];
  return {
    salesRecords,
    salesTotal: salesRecords.reduce((sum: number, sale: Sale) => sum + (sale.totalAmount || 0), 0),
    salesCount: salesRecords.length
  };
};

/**
 * 將原始記帳儀表板數據轉換為 AccountingDashboardDto
 */
export const mapToAccountingDashboardDto = (data: any): AccountingDashboardDto => {
  const accountingRecords = data.accountingRecords || [];
  return {
    accountingRecords,
    accountingTotal: accountingRecords.reduce((sum: number, record: ExtendedAccountingRecord) => sum + (record.totalAmount || 0), 0)
  };
};