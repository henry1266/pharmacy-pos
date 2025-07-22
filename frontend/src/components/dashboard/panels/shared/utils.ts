import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

/**
 * 共用工具函數
 */

// 格式化日期
export const formatDate = (date: string | Date | undefined, formatStr: string = 'MM/dd HH:mm'): string => {
  return date ? format(new Date(date), formatStr, { locale: zhTW }) : '';
};

// 獲取客戶名稱
export const getCustomerName = (customer: any): string => {
  return typeof customer === 'string' ? customer : customer?.name ?? '一般客戶';
};

// 獲取供應商名稱
export const getSupplierName = (supplier: any): string => {
  return typeof supplier === 'string' ? supplier : supplier?.name ?? '未知供應商';
};

// 獲取產品名稱
export const getProductName = (product: any): string => {
  return typeof product === 'object' && product?.name
    ? product.name
    : (typeof product === 'string' ? product : '未知商品');
};

// 付款方式映射
export const getPaymentMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    'cash': '現金',
    'credit_card': '信用卡',
    'debit_card': '金融卡',
    'mobile_payment': '行動支付',
    'other': '其他'
  };
  return methodMap[method] ?? method;
};

// 付款狀態資訊
export interface PaymentStatusInfo {
  text: string;
  color: 'success' | 'warning' | 'info' | 'error' | 'default';
}

export const getPaymentStatusInfo = (status: string): PaymentStatusInfo => {
  const statusMap: Record<string, PaymentStatusInfo> = {
    'paid': { text: '已付款', color: 'success' },
    'pending': { text: '待付款', color: 'warning' },
    'partial': { text: '部分付款', color: 'info' },
    'cancelled': { text: '已取消', color: 'error' },
    '已付': { text: '已付款', color: 'success' },
    '未付': { text: '未付款', color: 'warning' },
    '已收款': { text: '已收款', color: 'success' },
    '已開立': { text: '已開立', color: 'info' },
    '未收': { text: '未收款', color: 'warning' }
  };
  return statusMap[status] ?? { text: status, color: 'default' };
};

// 訂單狀態資訊
export interface OrderStatusInfo {
  text: string;
  color: 'success' | 'warning' | 'info' | 'error' | 'default';
}

export const getOrderStatusInfo = (status: string): OrderStatusInfo => {
  const statusMap: Record<string, OrderStatusInfo> = {
    'completed': { text: '已完成', color: 'success' },
    'pending': { text: '待處理', color: 'warning' },
    'processing': { text: '處理中', color: 'info' },
    'cancelled': { text: '已取消', color: 'error' },
    'draft': { text: '草稿', color: 'default' }
  };
  return statusMap[status] ?? { text: status, color: 'default' };
};

// 創建搜尋欄位提取器
export const createSearchFieldsExtractor = <T>(
  fieldExtractors: Array<(item: T) => string>
) => {
  return (item: T): string[] => {
    return fieldExtractors.map(extractor => extractor(item));
  };
};

// 通用的總金額計算器
export const createTotalAmountCalculator = <T>(
  amountExtractor: (item: T) => number
) => {
  return (items: T[]): number => {
    return items.reduce((sum, item) => sum + amountExtractor(item), 0);
  };
};

// 出貨單特殊的總金額計算（基於 items）
export const calculateShippingOrderTotal = (order: any): number => {
  return order.items?.reduce((sum: number, item: any) => 
    sum + (item.quantity * item.price), 0) || 0;
};

// 轉換項目為標準格式
export const convertToStandardItems = (items: any[]): Array<{
  name: string;
  quantity: number;
  price?: number;
}> => {
  return items.map(item => ({
    name: getProductName(item.product),
    quantity: item.quantity,
    price: item.price
  }));
};