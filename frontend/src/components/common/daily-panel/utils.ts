import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// 格式化日期
export const formatDate = (date: string | Date | undefined, formatStr: string = 'MM/dd HH:mm'): string => {
  return date ? format(new Date(date), formatStr, { locale: zhTW }) : '';
};

// 取得客戶名稱
export const getCustomerName = (customer: any): string => {
  return typeof customer === 'string' ? customer : customer?.name ?? '一般客戶';
};

// 取得供應商名稱
export const getSupplierName = (supplier: any): string => {
  return typeof supplier === 'string' ? supplier : supplier?.name ?? '未知供應商';
};

// 取得商品名稱
export const getProductName = (product: any): string => {
  return typeof product === 'object' && product?.name
    ? product.name
    : (typeof product === 'string' ? product : '未知商品');
};

// 付款方式文字
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
    '待付': { text: '待付款', color: 'warning' },
    '已收款': { text: '已收款', color: 'success' },
    '已退款': { text: '已退款', color: 'info' },
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

// 建立可搜尋欄位抽取器
export const createSearchFieldsExtractor = <T>(
  fieldExtractors: Array<(item: T) => string>
) => {
  return (item: T): string[] => {
    return fieldExtractors.map(extractor => extractor(item));
  };
};

// 建立總金額計算器
export const createTotalAmountCalculator = <T>(
  amountExtractor: (item: T) => number
) => {
  return (items: T[]): number => {
    return items.reduce((sum, item) => sum + amountExtractor(item), 0);
  };
};

// 計算出貨單總金額（依 items 計算）
export const calculateShippingOrderTotal = (order: any): number => {
  return order.items?.reduce((sum: number, item: any) =>
    sum + (item.quantity * item.price), 0) || 0;
};

// 轉換為標準化的項目格式
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

