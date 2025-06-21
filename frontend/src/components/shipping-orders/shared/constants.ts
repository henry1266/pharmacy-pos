/**
 * 出貨單模組共用常數定義
 */

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

// 狀態配置
export const STATUS_CONFIG = {
  pending: { color: 'warning', text: '待處理' },
  processing: { color: 'info', text: '處理中' },
  completed: { color: 'success', text: '已完成' },
  cancelled: { color: 'error', text: '已取消' }
} as const;

// 付款狀態配置
export const PAYMENT_STATUS_CONFIG = {
  unpaid: { color: 'error', text: '未付款' },
  partial: { color: 'warning', text: '部分付款' },
  paid: { color: 'success', text: '已付款' },
  refunded: { color: 'info', text: '已退款' }
} as const;

// 表格本地化文字
export const TABLE_LOCALE_TEXT = {
  noRowsLabel: '沒有出貨單記錄',
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
  basicInfo: { index: 0, label: '基本資訊', description: '導入出貨單基本資訊，包括出貨單號、發票號碼、發票日期、客戶等。' },
  items: { index: 1, label: '藥品項目', description: '導入出貨單藥品項目，包括出貨單號、藥品代碼、數量、總金額等。' }
} as const;

// 表格欄位配置
export const TABLE_COLUMNS = {
  sequence: { field: 'sequence', headerName: '序號', width: 60, align: 'center' as const },
  drugCode: { field: 'did', headerName: '藥品代碼', flex: 1 },
  drugName: { field: 'dname', headerName: '藥品名稱', flex: 1 },
  quantity: { field: 'dquantity', headerName: '數量', align: 'right' as const },
  totalCost: { field: 'dtotalCost', headerName: '總成本', align: 'right' as const },
  unitPrice: { field: 'unitPrice', headerName: '單價', align: 'right' as const },
  actions: { field: 'actions', headerName: '操作', align: 'center' as const, width: 200 }
} as const;

// 出貨單表格欄位配置
export const SHIPPING_ORDER_COLUMNS = {
  soid: { field: 'soid', headerName: '出貨單號', flex: 1 },
  supplier: { field: 'sosupplier', headerName: '供應商', flex: 1 },
  totalAmount: { field: 'totalAmount', headerName: '總金額', flex: 1 },
  status: { field: 'status', headerName: '狀態', flex: 1 },
  paymentStatus: { field: 'paymentStatus', headerName: '付款狀態', flex: 1 },
  actions: { field: 'actions', headerName: '操作', flex: 1, sortable: false, filterable: false }
} as const;