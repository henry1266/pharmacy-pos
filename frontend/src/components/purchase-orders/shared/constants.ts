/**
 * 進貨單模組共用常數定義
 */

import { createStatusConfig, createColumnConfig } from './utils';

// 表格配置
export const TABLE_CONFIG = {
  maxHeight: '350px',
  minRowHeight: 52,
  headerHeight: 56,
  paginationOptions: [5, 10, 25, 50],
  defaultPageSize: 10
} as const;

// 檔案上傳配置
export const FILE_UPLOAD_CONFIG = {
  acceptedTypes: '.csv',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedExtensions: ['csv']
} as const;

// 狀態配置 - 使用工廠函數減少重複
export const STATUS_CONFIG = createStatusConfig([
  { key: 'pending', color: 'warning', text: '待處理' },
  { key: 'approved', color: 'info', text: '已核准' },
  { key: 'received', color: 'primary', text: '已接收' },
  { key: 'completed', color: 'success', text: '已完成' },
  { key: 'cancelled', color: 'error', text: '已取消' }
]);

// 付款狀態配置 - 使用工廠函數減少重複
export const PAYMENT_STATUS_CONFIG = createStatusConfig([
  { key: '未付', color: 'error', text: '未付款' },
  { key: '已下收', color: 'warning', text: '已下收' },
  { key: '已匯款', color: 'success', text: '已匯款' }
]);

// 表格本地化文字
export const TABLE_LOCALE_TEXT = {
  noRowsLabel: '沒有進貨單記錄',
  footerRowSelected: (count: number) => `已選擇 ${count} 個項目`,
  columnMenuLabel: '選單',
  columnMenuShowColumns: '顯示欄位',
  columnMenuFilter: '篩選',
  columnMenuHideColumn: '隱藏',
  columnMenuUnsort: '取消排序',
  columnMenuSortAsc: '升序排列',
  columnMenuSortDesc: '降序排列',
  filterPanelAddFilter: '新增篩選',
  filterPanelDeleteIconLabel: '刪除',
  filterPanelOperator: '運算子',
  filterPanelOperatorAnd: '與',
  filterPanelOperatorOr: '或',
  filterPanelColumns: '欄位',
  filterPanelInputLabel: '值',
  filterPanelInputPlaceholder: '篩選值',
  columnsPanelTextFieldLabel: '尋找欄位',
  columnsPanelTextFieldPlaceholder: '欄位名稱',
  columnsPanelDragIconLabel: '重新排序欄位',
  columnsPanelShowAllButton: '顯示全部',
  columnsPanelHideAllButton: '隱藏全部',
  toolbarDensity: '密度',
  toolbarDensityLabel: '密度',
  toolbarDensityCompact: '緊湊',
  toolbarDensityStandard: '標準',
  toolbarDensityComfortable: '舒適',
  toolbarExport: '匯出',
  toolbarExportLabel: '匯出',
  toolbarExportCSV: '下載CSV',
  toolbarExportPrint: '列印',
  toolbarColumns: '欄位',
  toolbarColumnsLabel: '選擇欄位',
  toolbarFilters: '篩選',
  toolbarFiltersLabel: '顯示篩選',
  toolbarFiltersTooltipHide: '隱藏篩選',
  toolbarFiltersTooltipShow: '顯示篩選',
  toolbarQuickFilterPlaceholder: '搜尋...',
  toolbarQuickFilterLabel: '搜尋',
  toolbarQuickFilterDeleteIconLabel: '清除',
  paginationRowsPerPage: '每頁行數:',
  paginationPageSize: '頁面大小',
  paginationLabelRowsPerPage: '每頁行數:'
} as const;

// CSV 導入標籤頁配置
export const CSV_IMPORT_TABS = {
  basicInfo: { index: 0, label: '基本資訊', description: '導入進貨單基本資訊，包括進貨單號、發票號碼、發票日期、供應商等。' },
  items: { index: 1, label: '藥品項目', description: '導入進貨單藥品項目，包括進貨單號、藥品代碼、數量、總金額等。' }
} as const;

// 表格欄位配置 - 使用工廠函數減少重複
export const TABLE_COLUMNS = createColumnConfig([
  { key: 'sequence', field: 'sequence', headerName: '序號', width: 60, align: 'center' },
  { key: 'drugCode', field: 'did', headerName: '藥品代碼', flex: 1 },
  { key: 'drugName', field: 'dname', headerName: '藥品名稱', flex: 1 },
  { key: 'quantity', field: 'dquantity', headerName: '數量', align: 'right' },
  { key: 'totalCost', field: 'dtotalCost', headerName: '總成本', align: 'right' },
  { key: 'unitPrice', field: 'unitPrice', headerName: '單價', align: 'right' },
  { key: 'actions', field: 'actions', headerName: '操作', align: 'center', width: 200 }
]);

// 進貨單表格欄位配置 - 使用工廠函數減少重複
export const PURCHASE_ORDER_COLUMNS = createColumnConfig([
  { key: 'poid', field: 'poid', headerName: '進貨單號', flex: 1 },
  { key: 'pobill', field: 'pobill', headerName: '發票號碼', flex: 1 },
  { key: 'supplier', field: 'posupplier', headerName: '供應商', flex: 1 },
  { key: 'totalAmount', field: 'totalAmount', headerName: '總金額', flex: 1 },
  { key: 'status', field: 'status', headerName: '狀態', flex: 1 },
  { key: 'paymentStatus', field: 'paymentStatus', headerName: '付款狀態', flex: 1 },
  { key: 'actions', field: 'actions', headerName: '操作', flex: 1, sortable: false, filterable: false }
]);