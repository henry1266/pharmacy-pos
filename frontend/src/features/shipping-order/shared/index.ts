/**
 * 出貨單模組共用元件索引檔案
 *
 * 此文件遵循明確的命名導出策略，清晰定義模組的公共 API。
 * 避免使用通配符 * 導出，以提高代碼可讀性和可維護性。
 *
 * @see README.md 了解更多關於導出規範的信息
 */

// 類型導出
export type {
  Item,
  ShippingOrder,
  ItemsTableProps,
  CsvImportDialogProps,
  ShippingOrdersTableProps,
  EditableRowProps,
  DisplayRowProps,
  ActionButtonsProps,
  FileUploadProps,
  StatusMessageProps
} from './types';

// 常數導出
export {
  TABLE_CONFIG,
  FILE_UPLOAD_CONFIG,
  STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  TABLE_LOCALE_TEXT,
  CSV_IMPORT_TABS,
  TABLE_COLUMNS,
  SHIPPING_ORDER_COLUMNS
} from './constants';

// 工具函數導出
export {
  calculateUnitPrice,
  formatAmount,
  validateFileType,
  validateFileSize,
  getLocalizedPaginationText,
  validateItem,
  calculateTotalAmount,
  moveArrayItem,
  deepClone,
  debounce,
  throttle,
  generateUniqueId,
  safeNumber,
  safeString,
  createDetailItem,
  createStatusConfig,
  createColumnConfig
} from './utils';

// 共用組件導出
export {
  EditableRow,
  DisplayRow,
  ActionButtons,
  FileUpload,
  StatusMessage,
  LoadingButton,
  EmptyState,
  TableHeaderRow,
  StatusChipRenderer,
  PaymentStatusChipRenderer,
  AmountRenderer,
  DateTimeRenderer
} from './components';

// Hooks 導出
export {
  useItemsManagement,
  useCsvImport,
  useTablePagination,
  useTableLoading,
  useTableSelection,
  useTableFilter,
  useTableSort
} from './hooks';