/**
 * 共用 Daily Panel 組件和工具的統一匯出
 */

// 主要組件
export { default as DailyPanel } from './DailyPanel';
export type { DailyPanelProps, DailyPanelConfig } from './DailyPanel';

// 共用組件
export {
  ItemSummary,
  ItemDetailHeader,
  ItemList,
  DetailLink
} from './components/ItemSummary';
export type {
  ItemSummaryProps,
  ItemDetailHeaderProps,
  ItemListProps,
  DetailLinkProps
} from './components/ItemSummary';

// Hooks
export { useExpandableList } from './hooks/useExpandableList';
export { useDailyFilter, createDateFilter, createSalesDateFilter } from './hooks/useDailyFilter';

// 樣式
export { DAILY_PANEL_STYLES } from './styles';

// 工具函數
export {
  formatDate,
  getCustomerName,
  getSupplierName,
  getProductName,
  getPaymentMethodText,
  getPaymentStatusInfo,
  getOrderStatusInfo,
  createSearchFieldsExtractor,
  createTotalAmountCalculator,
  calculateShippingOrderTotal,
  convertToStandardItems
} from './utils';
export type { PaymentStatusInfo, OrderStatusInfo } from './utils';