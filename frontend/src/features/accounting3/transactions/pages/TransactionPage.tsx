import React, { useState, useEffect } from 'react';
import { keyframes } from '@emotion/react';
import { 
  Box, 
  Typography, 
  TextField, 
  InputAdornment, 
  IconButton, 
  Button, 
  Alert, 
  Snackbar, 
  Chip,
  CircularProgress,
  Paper,
  Card,
  CardContent
} from '@mui/material';
import { 
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterAlt as FilterAltIcon,
  ArrowBack as ArrowBackIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { useAppSelector } from '../../../../hooks/redux';

// 導入自定義 hook
import { useTransactionPage } from '../hooks/useTransactionPage';

// 導入子組件
import FilterPanel from '../components/FilterPanel';
import { TransactionDetailPanel } from '../components';
import CommonListPageLayout from '@/components/common/CommonListPageLayout';
import TitleWithCount from '@/components/common/TitleWithCount';
import WildcardSearchHelp from '@/components/common/WildcardSearchHelp';

// 導入類型
import { FilterOptions } from '../../payments/types';
import { TransactionGroupWithEntries3 } from '@pharmacy-pos/shared/types/accounting3';
import { FUNDING_TYPES_3, TRANSACTION_STATUS_3 } from '@pharmacy-pos/shared/types/accounting3';

// 箭頭動畫
const arrowBounce = keyframes`
  0%, 100% {
    transform: translateX(-5px);
  }
  50% {
    transform: translateX(-15px);
  }
`;

/**
 * 會計系統交易列表頁面
 * 專門用於管理交易的頁面
 */
export const TransactionPage: React.FC = () => {
  // 使用自定義 hook 獲取頁面狀態和事件處理函數
  const {
    // 狀態
    transactionGroups,
    loading,
    error,
    pagination,
    showFilters,
    searchTerm,
    snackbar,
    
    // 事件處理函數
    setSearchTerm,
    setShowFilters,
    handleCreateNew,
    handleEdit,
    handleView,
    handleDelete,
    handleCopy,
    handleConfirm,
    handleUnlock,
    handleCloseSnackbar,
  } = useTransactionPage();

  // 獲取帳戶和組織數據
  const { accounts } = useAppSelector(state => state.account2);
  const { organizations } = useAppSelector(state => state.organization);

  // 過濾選項狀態
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: null,
    endDate: null,
    status: '',
    type: '',
    minAmount: '',
    maxAmount: '',
    account: '',
    category: ''
  });

  // 詳細面板顯示與資料
  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionGroupWithEntries3 | null>(null);

  // 處理過濾器變更
  const handleFilterChange = (name: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // 重置過濾器
  const handleResetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      status: '',
      type: '',
      minAmount: '',
      maxAmount: '',
      account: '',
      category: ''
    });
  };

  // 應用過濾器
  const handleApplyFilters = () => {
    // 這裡可以實現過濾邏輯
    console.log('應用過濾器:', filters);
  };

  // 處理分頁變更
  const handlePageChange = (_event: unknown, newPage: number) => {
    // 這裡可以實現分頁邏輯
    console.log('頁面變更:', newPage + 1);
  };

  // 處理每頁行數變更
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // 這裡可以實現每頁行數變更邏輯
    console.log('每頁行數變更:', parseInt(event.target.value, 10));
  };

  // 處理行點擊
  const handleRowClick = (params: any) => {
    const transaction = transactionGroups.find(t => t._id === params.row._id);
    if (transaction) {
      setSelectedTransaction(transaction as TransactionGroupWithEntries3);
      setShowDetailPanel(true);
    }
  };

  // 計算總金額
  const totalAmount = transactionGroups.reduce((sum, transaction) => {
    return sum + (transaction.totalAmount || 0);
  }, 0);

  // 獲取交易狀態標籤顏色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'confirmed': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // 獲取交易狀態中文名稱
  const getStatusLabel = (status: string) => {
    const statusItem = TRANSACTION_STATUS_3.find(item => item.value === status);
    return statusItem ? statusItem.label : status;
  };

  // 獲取資金類型中文名稱
  const getFundingTypeLabel = (type: string) => {
    const typeItem = FUNDING_TYPES_3.find(item => item.value === type);
    return typeItem ? typeItem.label : type;
  };

  // 定義表格欄位
  const columns = [
    { field: 'groupNumber', headerName: '交易單號', flex: 1.5 },
    {
      field: 'transactionDate',
      headerName: '日期',
      flex: 1.3,
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        try {
          const date = new Date(params.value);
          return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (error) {
          console.error('日期格式錯誤', error);
          return params.value;
        }
      }
    },
    { field: 'fundingTypeText', headerName: '資金類型', flex: 1.5 },
    {
      field: 'totalAmount',
      headerName: '總金額',
      flex: 1.3,
      valueFormatter: (params: any) => (params.value ? params.value.toLocaleString() : ''),
    },
    {
      field: 'status',
      headerName: '狀態',
      flex: 1.1,
      renderCell: (params: any) => (
        <Chip 
          label={getStatusLabel(params.value)} 
          color={getStatusColor(params.value) as any} 
          size="small" 
        />
      )
    },
    {
      field: 'actions',
      headerName: '操作',
      flex: 2,
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => handleView(params.row._id)} title="檢視">
            <SearchIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleEdit(params.row._id)} title="編輯">
            <AddIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(params.row._id)} title="刪除" color="error">
            <ClearIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  // DataGrid 資料列
  const rows = transactionGroups.map((transaction) => {
    const {
      _id,
      groupNumber,
      transactionDate,
      fundingType,
      totalAmount,
      status,
      description,
      invoiceNo,
      entries
    } = transaction;

    return {
      id: _id,
      _id,
      groupNumber: groupNumber ?? '未指定',
      transactionDate,
      fundingType,
      fundingTypeText: getFundingTypeLabel(fundingType),
      totalAmount: totalAmount ?? 0,
      status,
      description,
      invoiceNo,
      entries
    };
  });

  // 操作區塊
  const actionButtons = (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          placeholder="搜尋交易記錄（單號、日期、描述）"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ minWidth: { xs: '100%', sm: '300px' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')} edge="end">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <IconButton
          onClick={() => setShowFilters(!showFilters)}
          size="small"
          color={showFilters ? 'primary' : 'default'}
          title={showFilters ? '關閉過濾器' : '開啟過濾器'}
        >
          <FilterAltIcon />
        </IconButton>
        <WildcardSearchHelp />
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleCreateNew}>
          新增交易
        </Button>
      </Box>
    </Box>
  );

  // 詳細面板
  const detailPanel = showDetailPanel ? (
    <TransactionDetailPanel selectedTransaction={selectedTransaction} />
  ) : (
    <Card elevation={2} className="transaction-card" sx={{ borderRadius: '0.5rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s ease', '&:hover': { boxShadow: 6 }, '&:hover .arrow-icon': { animation: `${arrowBounce} 0.8s infinite`, color: 'primary.dark' } }}>
      <CardContent sx={{ textAlign: 'center', py: 3, width: '100%' }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <AccountBalanceIcon color="primary" sx={{ fontSize: '4rem', mb: 1, transition: 'all 0.3s ease', '&:hover': { transform: 'scale(1.1)', color: 'primary.dark' } }} />
        </Box>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'center' }}>
            <ArrowBackIcon color="primary" className="arrow-icon" sx={{ fontSize: '2rem', mr: 1, transform: 'translateX(-10px)', transition: 'color 0.3s ease' }} />
            <Typography variant="body1" color="primary.main" sx={{ fontWeight: 500 }}>
              從左側列表選擇
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            點選任一交易以查看詳情
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '95%', mx: 'auto' }}>
      {/* 過濾器面板 */}
      {showFilters && (
        <FilterPanel
          show={showFilters}
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          onApplyFilters={handleApplyFilters}
        />
      )}

      <CommonListPageLayout
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TitleWithCount title="交易管理" count={transactionGroups.length} />
            {/* 總額顯示 */}
            <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: 'primary.main', color: 'primary.contrastText', px: 2, py: 0.5, borderRadius: 2, minWidth: 'fit-content' }}>
              <Typography variant="caption" sx={{ fontSize: '0.8rem', mr: 1 }}>
                總額
              </Typography>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                ${totalAmount.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        }
        actionButtons={actionButtons}
        columns={columns}
        rows={rows}
        loading={loading}
        {...(error && { error })}
        onRowClick={handleRowClick}
        detailPanel={detailPanel}
        tableGridWidth={9}
        detailGridWidth={3}
        dataTableProps={{
          rowsPerPageOptions: [25, 50, 100],
          disablePagination: false,
          pageSize: 25,
          initialState: {
            pagination: { pageSize: 25 },
            sorting: {
              sortModel: [{ field: 'groupNumber', sort: 'desc' }],
            },
          },
          getRowId: (row: any) => row.id,
          sx: {}
        }}
      />

      {/* 通知 Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TransactionPage;