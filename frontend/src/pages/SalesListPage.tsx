import React, { useState, useEffect, FC, useMemo } from 'react';
import axios from 'axios'; // Keep for non-test mode
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Popover,
  CircularProgress,
  Fade,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  ArrowBack as ArrowBackIcon,
  ViewList as ViewListIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams, GridLocaleText } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import SalesPreview from '../components/sales/SalesPreview'; // Import the SalesPreview component
import { Customer } from '@pharmacy-pos/shared/types/entities';

// API 回應型別定義
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// 定義類型
interface SaleItem {
  product?: {
    name: string;
    _id?: string;
    id?: string;
  };
  name?: string;
  quantity: number;
  price: number;
  unitPrice?: number;
  amount?: number;
  subtotal?: number;
}

interface User {
  _id: string;
  name: string;
}

// 使用與 SalesPreview 組件兼容的 ExtendedSale 類型
interface ExtendedSale {
  _id: string;
  saleNumber?: string;
  date?: string | Date;
  customer?: Customer | { name: string; _id?: string };
  items: SaleItem[];
  totalAmount?: number;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'mobile_payment' | 'other';
  paymentStatus: 'paid' | 'pending' | 'partial' | 'cancelled';
  status?: 'completed' | 'pending' | 'cancelled';
  user?: User;
  notes?: string;
  createdBy?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// 為了保持代碼兼容性，將 Sale 類型定義為 ExtendedSale 的別名
type Sale = ExtendedSale;

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

// Mock data for test mode
const mockSalesData: Sale[] = [
  {
    _id: 'mockSale001',
    saleNumber: 'TS-2025001',
    date: new Date().toISOString(),
    customer: { _id: 'mockCust001', name: '測試客戶A' },
    items: [
      { product: { _id: 'mockProd001', name: '測試藥品X' }, name: '測試藥品X', quantity: 2, price: 150, unitPrice: 150, subtotal: 300 },
      { product: { _id: 'mockProd002', name: '測試藥品Y' }, name: '測試藥品Y', quantity: 1, price: 250, unitPrice: 250, subtotal: 250 },
    ],
    totalAmount: 550,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    user: { _id: 'mockUser001', name: '測試使用者' },
    notes: '這是一筆測試銷售記錄。'
  },
  {
    _id: 'mockSale002',
    saleNumber: 'TS-2025002',
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), // Yesterday
    customer: { _id: 'mockCust002', name: '測試客戶B' },
    items: [
      { product: { _id: 'mockProd003', name: '測試保健品Z' }, name: '測試保健品Z', quantity: 3, price: 300, unitPrice: 300, subtotal: 900 },
    ],
    totalAmount: 900,
    paymentMethod: 'credit_card',
    paymentStatus: 'pending',
    user: { _id: 'mockUser001', name: '測試使用者' },
    notes: '這是另一筆測試銷售記錄，待付款。'
  },
];

// 付款方式和狀態的映射函數
const getPaymentMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    'cash': '現金',
    'credit_card': '信用卡',
    'debit_card': '金融卡',
    'mobile_payment': '行動支付',
    'other': '其他'
  };
  return methodMap[method] ?? method;
};

interface PaymentStatusInfo {
  text: string;
  color: 'success' | 'warning' | 'info' | 'error' | 'default';
}

const getPaymentStatusInfo = (status: string): PaymentStatusInfo => {
  const statusMap: Record<string, PaymentStatusInfo> = {
    'paid': { text: '已付款', color: 'success' },
    'pending': { text: '待付款', color: 'warning' },
    'partial': { text: '部分付款', color: 'info' },
    'cancelled': { text: '已取消', color: 'error' }
  };
  return statusMap[status] ?? { text: status, color: 'default' };
};

// 本地化文字配置
const TABLE_LOCALE_TEXT = {
  noRowsLabel: '沒有銷售記錄',
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

// 獲取本地化分頁文字
const getLocalizedPaginationText = (from: number, to: number, count: number): string => {
  const countDisplay = count !== -1 ? count.toString() : '超過 ' + to;
  return `${from}-${to} / ${countDisplay}`;
};

// 銷售列表頁面元件
const SalesListPage: FC = () => {
  const navigate = useNavigate();
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const [previewAnchorEl, setPreviewAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    const testModeActive = localStorage.getItem('isTestMode') === 'true';
    setIsTestMode(testModeActive);
    fetchSales(testModeActive);
  }, []);

  // 獲取銷售數據
  const fetchSales = async (testModeEnabled: boolean): Promise<void> => {
    setLoading(true);
    setError(null);
    
    if (testModeEnabled) {
      await fetchTestModeSales();
    } else {
      await fetchProductionSales();
    }
  };

  // 測試模式下獲取銷售數據
  const fetchTestModeSales = async (): Promise<void> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500)); 
      // Simulate a potential error even in test mode for fallback to mock
      // if (Math.random() < 0.3) throw new Error("Simulated API error in test mode");
      const response = await axios.get<ApiResponse<Sale[]>>('/api/sales'); // Attempt real fetch
      // 後端回傳的是 ApiResponse 格式: { success, message, data, timestamp }
      const salesData = response.data.data ?? [];
      if (Array.isArray(salesData) && salesData.length > 0) {
          setSales(salesData);
      } else {
          console.log("Test Mode: No actual sales data, using mock data.");
          setSales(mockSalesData);
      }
    } catch (err) {
      console.warn('Test Mode: Failed to fetch actual sales, using mock data.', err);
      setSales(mockSalesData);
      // setError('測試模式：載入實際銷售數據失敗，已使用模擬數據。'); // Optional: inform user
    } finally {
      setLoading(false);
    }
  };

  // 生產模式下獲取銷售數據
  const fetchProductionSales = async (): Promise<void> => {
    try {
      const response = await axios.get<ApiResponse<Sale[]>>('/api/sales');
      // 後端回傳的是 ApiResponse 格式: { success, message, data, timestamp }
      const salesData = response.data.data ?? [];
      if (Array.isArray(salesData)) {
        setSales(salesData);
      } else {
        console.warn('API 回傳的資料格式不正確:', response.data);
        setSales([]);
      }
    } catch (err) {
      console.error('獲取銷售數據失敗:', err);
      setError('獲取銷售數據失敗');
      setSnackbar({
        open: true,
        message: '獲取銷售數據失敗',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  /** 處理搜尋框異動 */
const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
  setSearchTerm(e.target.value);
};

/** 依搜尋字串產生過濾後的銷售清單 */
const filteredSales = useMemo(() => {
  const keyword = searchTerm.trim().toLowerCase();

  const filtered = sales.filter(({ customer, items, _id, saleNumber, date }) => {
    /** 收集所有可搜尋欄位；必要時只要 push 新欄位即可 */
    const searchableFields: string[] = [
      customer?.name ?? '',
      items.map(item => item.product?.name ?? '').join(' '),
      String(_id ?? ''),          // ← 先轉字串再比對
      String(saleNumber ?? ''),
      date ? format(new Date(date), 'yyyy-MM-dd') : ''
    ];

    // 只要任一欄位包含關鍵字即通過
    return searchableFields.some(field =>
      field.toLowerCase().includes(keyword)
    );
  });

  // 為DataGrid準備行數據
  return filtered.map(sale => ({
    id: sale._id, // DataGrid需要唯一的id字段
    _id: sale._id, // 保留原始_id用於操作
    saleNumber: sale.saleNumber ?? '無單號',
    // 保存原始日期值，讓 valueFormatter 處理格式化
    date: sale.date,
    customerName: sale.customer?.name ?? '一般客戶',
    items: sale.items,
    totalAmount: sale.totalAmount ?? 0,
    paymentMethod: sale.paymentMethod,
    paymentStatus: sale.paymentStatus,
    ...sale // 保留其他屬性
  }));
}, [sales, searchTerm]);   // ← 依賴項

  // 處理刪除銷售記錄
  const handleDeleteSale = async (id: string): Promise<void> => {
    if (isTestMode) {
      handleTestModeDelete(id);
      return;
    }

    await handleProductionDelete(id);
  };

  // 測試模式下的刪除處理
  const handleTestModeDelete = (id: string): void => {
    setSales(prevSales => prevSales.filter(sale => sale._id !== id));
    setSnackbar({
      open: true,
      message: '測試模式：銷售記錄已模擬刪除',
      severity: 'info'
    });
    setConfirmDeleteId(null);
  };

  // 生產模式下的刪除處理
  const handleProductionDelete = async (id: string): Promise<void> => {
    try {
      await axios.delete(`/api/sales/${id}`);
      fetchSales(isTestMode); // Refetch after delete
      setSnackbar({
        open: true,
        message: '銷售記錄已刪除',
        severity: 'success'
      });
    } catch (err) {
      console.error('刪除銷售記錄失敗:', err);
      setSnackbar({
        open: true,
        message: '刪除銷售記錄失敗',
        severity: 'error'
      });
    }
    setConfirmDeleteId(null);
  };

  // 關閉確認對話框
  const handleCloseConfirmDialog = (): void => {
    setConfirmDeleteId(null);
  };

  // 關閉提示訊息
  const handleCloseSnackbar = (): void => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 處理預覽點擊
  const handlePreviewClick = (event: React.MouseEvent<HTMLButtonElement>, sale: Sale): void => {
    setPreviewAnchorEl(event.currentTarget);
    setSelectedSale(sale);
    setPreviewLoading(false); // Reset loading/error for preview
    setPreviewError(null);
  };

  // 關閉預覽
  const handlePreviewClose = (): void => {
    setPreviewAnchorEl(null);
    setSelectedSale(null);
  };

  const isPreviewOpen = Boolean(previewAnchorEl);
  const previewId = isPreviewOpen ? 'sales-preview-popover' : undefined;

  // 導航處理函數
  const handleAddNewSale = (): void => {
    navigate('/sales/new');
  };

  const handleAddNewSaleV2 = (): void => {
    navigate('/sales/new2');
  };

  const handleEditSale = (saleId: string): void => {
    navigate(`/sales/edit/${saleId}`);
  };
  
  const handleViewSale = (saleId: string): void => {
    navigate(`/sales/${saleId}`);
  }

  // 表格列定義
  const columns: GridColDef[] = [
    {
      field: 'saleNumber',
      headerName: '銷貨單號',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Button
          size="small"
          color="primary"
          onClick={() => handleViewSale(params.row._id)}
        >
          {params.value}
        </Button>
      )
    },
    {
      field: 'date',
      headerName: '日期',
      flex: 1,
      valueFormatter: (params) => {
        if (!params.value) return '';
        
        try {
          // 確保我們有一個有效的日期對象
          const dateObj = typeof params.value === 'string'
            ? new Date(params.value)
            : params.value instanceof Date
              ? params.value
              : new Date();
              
          // 檢查日期是否有效
          if (isNaN(dateObj.getTime())) {
            console.warn('無效的日期值:', params.value);
            return String(params.value);
          }
          
          // 使用指定格式
          return format(dateObj, 'yyyy-MM-dd-HH:mm:ss', { locale: zhTW });
        } catch (e) {
          console.error('日期格式化錯誤:', e, params.value);
          return String(params.value);
        }
      }
    },
    {
      field: 'customerName',
      headerName: '客戶',
      flex: 1
    },
    {
      field: 'items',
      headerName: '產品',
      flex: 3, // 增加產品欄位的寬度比例
      minWidth: 250, // 設置最小寬度確保內容可見
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          {params.value.map((item: SaleItem, index: number) => (
            <div key={`${params.row._id}-${item.product?._id ?? item.name}-${index}`}>
              {item.product?.name ?? item.name} x {item.quantity}
            </div>
          ))}
        </Box>
      )
    },
    {
      field: 'totalAmount',
      headerName: '總金額',
      flex: 0.8,
      minWidth: 120, // 確保金額欄位有足夠寬度
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => {
        return params.value ? params.value.toFixed(2) : '0.00';
      }
    },
    {
      field: 'paymentMethod',
      headerName: '付款方式',
      flex: 0.8,
      minWidth: 120, // 確保付款方式欄位有足夠寬度
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (params) => {
        return getPaymentMethodText(params.value);
      }
    },
    {
      field: 'paymentStatus',
      headerName: '付款狀態',
      flex: 0.8,
      minWidth: 120, // 確保付款狀態欄位有足夠寬度
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={getPaymentStatusInfo(params.value).text}
          color={getPaymentStatusInfo(params.value).color}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: '操作',
      flex: 0.8,
      minWidth: 150, // 確保操作欄位有足夠寬度顯示所有按鈕
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            size="small"
            onClick={(event) => handlePreviewClick(event, params.row)}
            title="查看詳情"
            aria-describedby={previewId}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleEditSale(params.row._id)}
            title="編輯"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => setConfirmDeleteId(params.row._id)}
            title="刪除"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  // 創建骨架屏載入效果
  const renderSkeleton = () => (
    <Box sx={{
      width: '100%',
      mt: 1,
      bgcolor: 'background.paper', // 使用主題的背景色
      borderRadius: 1,
      height: '100%',
      minHeight: '70vh' // 確保至少佔據70%的視窗高度
    }}>
      {[...Array(15)].map((_, index) => ( // 增加到15行以填滿更多空間
        <Box
          key={index}
          sx={{
            display: 'flex',
            mb: 1,
            opacity: 0,
            animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            animationDelay: `${index * 0.05}s`
          }}
        >
          {[...Array(8)].map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="rectangular"
              width={`${100 / 8}%`}
              height={52}
              animation="wave"
              sx={{
                mx: 0.5,
                borderRadius: 1,
                opacity: 1 - (index * 0.1), // 漸變效果
                bgcolor: 'action.hover', // 使用主題的懸停色，通常是淺灰色
                '&::after': {
                  background: 'linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.04), transparent)'
                }
              }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          銷售記錄 {isTestMode && <Typography component="span" sx={{ fontSize: '0.8em', color: 'orange', fontWeight: 'bold' }}>(測試模式)</Typography>}
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddNewSale}
            sx={{ mr: 1 }}
          >
            新增銷售 {isTestMode && "(模擬)"}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ViewListIcon />}
            onClick={handleAddNewSaleV2}
            sx={{ mr: 1 }}
          >
            新增銷售 v2 {isTestMode && "(模擬)"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')} // Assuming '/' is the dashboard or home
          >
            返回首頁
          </Button>
        </Box>
      </Box>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="搜索銷售記錄（銷貨單號、客戶名稱、產品、ID、日期）"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </CardContent>
      </Card>
      
      <Box sx={{
        width: '100%',
        position: 'relative',
        minHeight: '70vh', // 增加最小高度以填滿更多螢幕空間
        height: '100%',
        bgcolor: 'background.paper', // 確保整個容器使用相同的背景色
        borderRadius: 1,
        border: 1, // 添加外邊框
        borderColor: 'divider', // 使用主題的分隔線顏色
        boxShadow: 1, // 添加輕微陰影增強視覺效果
        overflow: 'hidden' // 確保內容不會溢出圓角
      }}>
        <Fade in={!loading} timeout={1000}>
          <Box sx={{
            position: loading ? 'absolute' : 'relative',
            width: '100%',
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: 'none' // 不需要為骨架屏添加邊框，因為它在容器內部
          }}>
            <DataGrid
              rows={filteredSales}
              columns={columns}
              checkboxSelection={false}
              disableSelectionOnClick
              loading={false} // 由於我們自己控制載入效果，這裡設為false
              autoHeight
              rowsPerPageOptions={[10, 25, 50, 100]}
              pageSize={25}
              initialState={{
                sorting: {
                  sortModel: [{ field: 'saleNumber', sort: 'desc' }] // 預設按銷貨編號降序排序，但允許用戶調整
                }
              }}
              getRowId={(row) => row.id}
              getRowClassName={(params) => `row-${params.indexRelativeToCurrentPage}`}
              localeText={{
                ...TABLE_LOCALE_TEXT,
                paginationLabelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) =>
                  getLocalizedPaginationText(from, to, count),
                MuiTablePagination: {
                  labelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) =>
                    getLocalizedPaginationText(from, to, count),
                  labelRowsPerPage: TABLE_LOCALE_TEXT.paginationLabelRowsPerPage
                }
              } as Partial<GridLocaleText>}
              sx={{
                // 基本樣式
                '& .MuiDataGrid-main': {
                  bgcolor: 'background.paper'
                },
                '& .MuiDataGrid-root': {
                  border: 'none' // 移除 DataGrid 自帶的邊框，因為我們已經為容器添加了邊框
                },
                // 基本行樣式
                '& .MuiDataGrid-row': {
                  opacity: 0,
                  animation: 'fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                  bgcolor: 'background.paper'
                },
                // 表頭樣式
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)', // 淺灰色表頭背景
                  fontWeight: 'bold',
                },
                // 單元格樣式
                '& .MuiDataGrid-cell': {
                  py: 1, // 增加單元格垂直內邊距
                },
                // 為每一行設置不同的動畫延遲
                ...[...Array(20)].reduce((styles, _, index) => ({
                  ...styles,
                  [`& .row-${index}`]: {
                    animationDelay: `${index * 0.03}s`,
                  },
                }), {}),
                '@keyframes fadeIn': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(5px)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)'
                  }
                }
              }}
            />
          </Box>
        </Fade>
        
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%', // 確保填滿整個容器高度
            minHeight: '70vh', // 確保至少佔據70%的視窗高度
            opacity: loading ? 1 : 0,
            visibility: loading ? 'visible' : 'hidden',
            transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            borderRadius: 1
          }}
        >
          {renderSkeleton()}
        </Box>
      </Box>
      
      <Popover
        id={previewId}
        open={isPreviewOpen}
        anchorEl={previewAnchorEl}
        onClose={handlePreviewClose}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
      >
        <SalesPreview
          sale={selectedSale as ExtendedSale}
          loading={previewLoading}
          error={previewError}
        />
      </Popover>
      
      <Dialog open={!!confirmDeleteId} onClose={handleCloseConfirmDialog}>
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您確定要刪除這筆銷售記錄嗎？{isTestMode ? "(測試模式下僅模擬刪除)" : "此操作將恢復相應的庫存，且無法撤銷。"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>取消</Button>
          <Button onClick={() => confirmDeleteId && handleDeleteSale(confirmDeleteId)} color="error" autoFocus>
            刪除
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SalesListPage;