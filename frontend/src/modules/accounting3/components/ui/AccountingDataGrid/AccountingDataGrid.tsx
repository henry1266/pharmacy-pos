import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Button,
  Alert,
  TextField,
  Stack,
} from '@mui/material';
import { DataGrid, GridLocaleText } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../../../hooks/redux';
import { fetchTransactionGroupsWithEntries } from '../../../../../redux/actions';

// 導入類型
import { AccountingDataGridProps, FilterOptions, TransactionRow, ExtendedTransactionGroupWithEntries } from './types';

// 導入自定義 Hook
import { useDebounce } from './hooks/useDebounce';

// 導入工具函數
import { isBalanced } from './utils/calculations';

// 導入 UI 組件
import { LoadingSkeleton } from './components/LoadingSkeleton';

// 導入列配置
import { createColumns } from './config/columns';

/**
 * 會計交易數據表格組件
 * 顯示交易群組列表，並提供各種操作功能
 */
export const AccountingDataGrid: React.FC<AccountingDataGridProps> = ({
  organizationId,
  showFilters = false,
  searchTerm = '',
  onCreateNew,
  onEdit,
  onCopy,
  onDelete,
  onView,
  onConfirm,
  onUnlock,
  paginationModel = { page: 0, pageSize: 25 },
  setPaginationModel
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // 使用 Redux 狀態
  const { transactionGroups, loading, error, pagination } = useAppSelector(state => state.transactionGroupWithEntries);

  // 處理帳戶點擊事件
  const handleAccountClick = useCallback((accountId: string | any) => {
    // 提取帳戶ID的工具函數
    const extractAccountId = (accountId: string | any): string | null => {
      if (typeof accountId === 'string') {
        return accountId;
      }
      if (typeof accountId === 'object' && accountId?._id) {
        return accountId._id;
      }
      return null;
    };

    const cleanId = extractAccountId(accountId);
    if (cleanId) {
      navigate(`/accounting3/accounts/${cleanId}`);
    }
  }, [navigate]);
  
  // 本地狀態管理
  const [filter, setFilter] = useState<FilterOptions>({
    search: '',
    status: '',
    startDate: null,
    endDate: null,
    page: 1,
    limit: 25
  });
  
  // 使用 debounce 處理搜索輸入，優先使用傳入的 searchTerm
  const debouncedSearch = useDebounce(searchTerm || filter.search, 500);
  
  // 監聽 searchTerm 變化，更新 filter.search
  useEffect(() => {
    if (searchTerm !== undefined) {
      setFilter(prev => ({
        ...prev,
        search: searchTerm,
        page: 1 // 重置到第一頁
      }));
      
      // 重置分頁到第一頁
      if (setPaginationModel) {
        setPaginationModel({
          ...paginationModel,
          page: 0 // DataGrid 的頁碼從 0 開始
        });
      }
    }
  }, [searchTerm, setPaginationModel, paginationModel]);
  
  // 為 DataGrid 準備行數據 - 使用 useMemo 優化
  const rows: TransactionRow[] = useMemo(() => transactionGroups.map(group => ({
    ...group,
    id: group._id, // DataGrid 需要唯一的 id 字段
  })), [transactionGroups]);

  // 載入交易群組資料
  const loadTransactionGroups = useCallback(() => {
    console.log('[Accounting3] 🔍 AccountingDataGrid - 載入交易群組:', {
      organizationId
    });

    const params: any = {
      organizationId,
      page: filter.page,
      limit: filter.limit
    };

    if (filter.search) params.search = filter.search;
    if (filter.status) params.status = filter.status;
    if (filter.startDate) params.startDate = filter.startDate.toISOString();
    if (filter.endDate) params.endDate = filter.endDate.toISOString();

    if (process.env.NODE_ENV === 'development') {
      console.log('[Accounting3] 🔍 發送分頁請求:', {
        page: filter.page,
        limit: filter.limit
      });
    }

    dispatch(fetchTransactionGroupsWithEntries(params) as any);
  }, [dispatch, organizationId, filter]);

  // 初始載入和篩選變更時重新載入
  useEffect(() => {
    console.log('[Accounting3] 🔍 AccountingDataGrid - 載入交易群組:', {
      organizationId,
      search: debouncedSearch,
      status: filter.status,
      startDate: filter.startDate,
      endDate: filter.endDate
    });

    const params: any = {
      organizationId,
      page: filter.page,
      limit: filter.limit
    };

    if (debouncedSearch) params.search = debouncedSearch;
    if (filter.status) params.status = filter.status;
    if (filter.startDate) params.startDate = filter.startDate.toISOString();
    if (filter.endDate) params.endDate = filter.endDate.toISOString();

    if (process.env.NODE_ENV === 'development') {
      console.log('[Accounting3] 🔍 發送分頁請求:', {
        page: filter.page,
        limit: filter.limit
      });
    }

    dispatch(fetchTransactionGroupsWithEntries(params) as any);
  }, [
    dispatch,
    organizationId,
    debouncedSearch,
    filter.status,
    filter.startDate,
    filter.endDate,
    filter.page,
    filter.limit
  ]);

  // 監聽 Redux 狀態變化
  useEffect(() => {
    console.log('[Accounting3] 📊 AccountingDataGrid Redux 狀態變化:', {
      transactionGroupsLength: transactionGroups.length,
      loading,
      error,
      pagination
    });
  }, [transactionGroups, loading, error, pagination]);

  // 使用 useCallback 記憶化事件處理函數
  const handleFilterChange = useCallback((field: keyof FilterOptions, value: any) => {
    setFilter(prev => ({
      ...prev,
      [field]: value,
      page: field !== 'page' ? 1 : value // 非分頁變更時重置到第一頁
    }));
    
    // 如果是篩選條件變更，重置分頁到第一頁
    if (field !== 'page' && field !== 'limit' && setPaginationModel) {
      setPaginationModel({
        ...paginationModel,
        page: 0 // DataGrid 的頁碼從 0 開始
      });
    }
  }, [paginationModel, setPaginationModel]);

  // 清除篩選，但保留每頁顯示數量
  const handleClearFilter = useCallback(() => {
    setFilter(prevFilter => ({
      search: '',
      status: '',
      startDate: null,
      endDate: null,
      page: 1,
      limit: prevFilter.limit // 保留用戶選擇的每頁顯示數量
    }));
    
    // 重置分頁到第一頁
    if (setPaginationModel) {
      setPaginationModel({
        ...paginationModel,
        page: 0 // DataGrid 的頁碼從 0 開始
      });
    }
  }, [paginationModel, setPaginationModel]);

  // 處理導航到詳情頁
  const handleNavigateToDetail = useCallback((id: string) => {
    navigate(`/accounting3/transaction/${id}`);
  }, [navigate]);

  // 創建列定義
  const columns = useMemo(() => createColumns({
    onEdit,
    onCopy,
    onDelete,
    onView,
    onConfirm,
    onUnlock,
    onNavigateToDetail: handleNavigateToDetail,
    handleAccountClick
  }), [onEdit, onCopy, onDelete, onView, onConfirm, onUnlock, handleNavigateToDetail, handleAccountClick]);

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        [Accounting3] {error}
        <Button onClick={loadTransactionGroups} sx={{ ml: 2 }}>
          重新載入
        </Button>
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
      <Paper sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* 會計交易列表標題區域 */}
        
        <Box>
          {/* 篩選器 */}
          {showFilters && (
            <Paper sx={{
              p: 1.5,
              mb: 2,
              bgcolor: 'background.paper',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              borderRadius: 1
            }} variant="outlined">
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                justifyContent: 'flex-end',
                minHeight: 48 // 確保最小高度一致
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterIcon fontSize="small" />
                  <Stack direction="row" spacing={2} alignItems="center">
                    <DatePicker
                      label="開始日期"
                      value={filter.startDate}
                      onChange={(newValue) => handleFilterChange('startDate', newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          sx={{
                            width: 180,
                            '& .MuiInputBase-root': {
                              height: 44 // 增加輸入框高度
                            }
                          }}
                        />
                      )}
                    />
                    <DatePicker
                      label="結束日期"
                      value={filter.endDate}
                      onChange={(newValue) => handleFilterChange('endDate', newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          sx={{
                            width: 180,
                            '& .MuiInputBase-root': {
                              height: 44 // 增加輸入框高度
                            }
                          }}
                        />
                      )}
                    />
                    <Button
                      size="small"
                      onClick={handleClearFilter}
                      sx={{
                        height: 44, // 增加按鈕高度
                        minWidth: 90 // 確保按鈕有足夠寬度
                      }}
                    >
                      清除篩選
                    </Button>
                  </Stack>
                </Box>
              </Box>
            </Paper>
          )}

          {/* 交易群組表格 - 使用 DataGrid */}
          <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ display: loading ? 'none' : 'block' }}>
              <Box sx={{
                position: 'relative',
                width: '100%',
                overflow: 'hidden'
              }}>
                {transactionGroups.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ReceiptIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                    <Stack spacing={2} alignItems="center">
                      <Stack spacing={1} alignItems="center">
                        <Stack spacing={0.5} alignItems="center">
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={onCreateNew}
                          >
                            建立交易
                          </Button>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Box>
                ) : (
                 <DataGrid
                   rows={rows}
                   columns={columns}
                   checkboxSelection={false}
                   disableSelectionOnClick
                   loading={false} // 由於我們自己控制載入效果，這裡設為false
                   autoHeight
                   getRowId={(row) => row.id}
                   rowBuffer={10} // 優化虛擬滾動，減少預渲染的行數
                   rowsPerPageOptions={[25, 50, 100]}
                   initialState={{
                     pagination: {
                       pageSize: 25,
                     },
                   }}
                   pagination
                   paginationMode="server"
                   page={filter.page - 1} // DataGrid 頁碼從 0 開始，而 API 從 1 開始
                   pageSize={filter.limit}
                   onPageChange={(newPage) => handleFilterChange('page', newPage + 1)} // +1 轉換為 API 頁碼
                   onPageSizeChange={(newPageSize) => handleFilterChange('limit', newPageSize)}
                   rowCount={pagination?.total || 0} // 使用後端返回的總記錄數
                   rowHeight={70} // 增加列高，給按鈕更多空間
                   columnVisibilityModel={{
                     // 確保操作列始終可見
                     actions: true
                   }}
                   sx={{
                     // 表頭樣式
                     '& .MuiDataGrid-columnHeaders': {
                       borderBottom: '1px solid',
                       borderColor: 'divider',
                       height: 48, // 固定表頭高度
                       '& .MuiDataGrid-columnHeaderTitle': {
                         fontWeight: 600 // 加粗表頭文字
                       }
                     },
                     // 基本行樣式 - 簡化，移除動畫效果
                     '& .MuiDataGrid-row': {
                       '&:hover': {
                         bgcolor: 'action.hover' // 懸停效果
                       },
                       '&:nth-of-type(even)': {
                         bgcolor: 'action.hover' // 斑馬紋效果
                       }
                     },
                     // 分頁控制區域
                     '& .MuiDataGrid-footerContainer': {
                       borderTop: '1px solid',
                       borderColor: 'divider'
                     }
                   }}
                   localeText={{
                     noRowsLabel: '沒有交易記錄',
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
                     paginationLabelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) => {
                       const countDisplay = count !== -1 ? count.toString() : '超過 ' + to;
                       return `${from}-${to} / ${countDisplay}`;
                     },
                     paginationLabelRowsPerPage: '每頁行數:'
                   } as Partial<GridLocaleText>}
                 />
                )}
              </Box>
            </Box>
            
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%', // 確保填滿整個容器高度
                  minHeight: '70vh', // 確保至少佔據70%的視窗高度
                  display: 'block',
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: 'none', // 不需要為骨架屏添加邊框，因為它在容器內部
                  zIndex: 1 // 確保骨架屏在數據表格之上
                }}
              >
                <LoadingSkeleton />
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default AccountingDataGrid;