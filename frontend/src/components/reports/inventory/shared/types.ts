/**
 * 庫存報表模組共用型別定義
 */

// 篩選條件的型別
export interface InventoryFilterValues {
  supplier?: string;
  category?: string;
  productCode?: string;
  productName?: string;
  productType?: string;
}

// 交易記錄的型別
export interface Transaction {
  purchaseOrderNumber: string;
  shippingOrderNumber: string;
  saleNumber: string;
  type: string;
  quantity: number;
  currentStock: number;
  price: number;
  date: Date;
  orderNumber: string;
  cumulativeStock?: number;
  cumulativeProfitLoss?: number;
}

// 分組後的產品數據型別
export interface GroupedProduct {
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  supplier: {
    name: string;
  };
  unit: string;
  price: number;
  status: string;
  totalQuantity: number;
  totalInventoryValue: number;
  totalPotentialRevenue: number;
  totalPotentialProfit: number;
  transactions: Transaction[];
}

// 交易項目的型別
export interface TransactionItem {
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  supplier: string | { name: string };
  unit: string;
  price?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  quantity: number;
  inventoryValue: number;
  potentialRevenue: number;
  potentialProfit: number;
  status: string;
  type: string;
  purchaseOrderNumber?: string;
  shippingOrderNumber?: string;
  saleNumber?: string;
  currentStock?: number;
  date?: Date;
  lastUpdated?: Date;
  totalAmount?: number;
  orderNumber?: string;
}

// 圖表數據項目的型別
export interface ChartDataItem {
  productId?: string;
  productName?: string;
  productCode?: string;
  orderNumber: string;
  type: string;
  quantity: number;
  price: number;
  profitLoss: number;
  cumulativeStock: number;
  cumulativeProfitLoss: number;
  positiveProfitLoss: number;
  negativeProfitLoss: number;
}

// API 響應型別
export interface InventoryApiResponse {
  data?: TransactionItem[];
  filters?: {
    categories?: string[];
  };
}

// 懸浮視窗位置的型別
export interface TooltipPosition {
  top: number;
  left: number;
}

// 自定義懸浮視窗組件 props 型別
export interface CustomTooltipProps {
  show: boolean;
  position: TooltipPosition;
  totalIncome: number;
  totalCost: number;
  formatCurrency: (amount: number) => string;
}

// 圖表自定義Tooltip props 型別
export interface ChartCustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataItem;
  }>;
  label?: string;
}

// 展開行組件 props 型別
export interface ExpandableRowProps {
  item: GroupedProduct;
  formatCurrency: (amount: number) => string;
}