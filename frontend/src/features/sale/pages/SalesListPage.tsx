/**
 * @file 銷售列表頁面
 * @description 顯示銷售記錄列表，提供搜索、預覽、編輯和刪除功能
 */

import React, { FC, useState } from 'react';
import { keyframes } from '@emotion/react';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterAlt as FilterAltIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PointOfSale as PointOfSaleIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useSalesList } from '../hooks/useSalesList';
import { SalesListPageProps, Sale } from '../types/list';
// 移除 SalesPreviewPopover 引入
import DeleteConfirmDialog from '../components/list/DeleteConfirmDialog';
import NotificationSnackbar from '../components/list/NotificationSnackbar';
import CommonListPageLayout from '@/components/common/CommonListPageLayout';
import TitleWithCount from '@/components/common/TitleWithCount';
import SalesDetailPanel from '../components/detail/SalesDetailPanel';
import WildcardSearchHelp from '@/components/common/WildcardSearchHelp';
import { getPaymentMethodText, getPaymentStatusInfo } from '../utils/listUtils';

/**
 * 銷售列表頁面
 * 顯示銷售記錄列表，提供搜索、預覽、編輯和刪除功能
 */
// 定義箭頭動畫
const arrowBounce = keyframes`
  0%, 100% {
    transform: translateX(-5px);
  }
  50% {
    transform: translateX(-15px);
  }
`;

const SalesListPage: FC<SalesListPageProps> = () => {
  const {
    // 狀態
    isTestMode,
    sales,
    loading,
    error,
    searchTerm,
    wildcardMode,
    confirmDeleteId,
    snackbar,
    previewAnchorEl,
    selectedSale,
    previewLoading,
    previewError,
    isPreviewOpen,
    previewId,
    totalAmount,

    // 處理函數
    handleSearchChange,
    handleWildcardModeChange,
    handleDeleteSale,
    handleCloseConfirmDialog,
    handleCloseSnackbar,
    handlePreviewClick,
    handlePreviewClose,
    handleAddNewSale,
    handleEditSale,
    handleViewSale,
    handleBackToHome
  } = useSalesList();

  // 創建一個本地狀態來控制詳情面板的顯示
  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(false);

  // 選擇銷售記錄函數 - 用於點擊表格行時
  const selectSale = async (id: string) => {
    try {
      // 直接從 sales 中查找選中的銷售記錄
      let selected = sales.find(sale => sale._id === id);
      
      // 如果找到了銷售記錄，但沒有完整數據，則需要獲取詳細數據
      if (selected && !selected.items) {
        try {
          // 獲取詳細數據
          const response = await fetch(`/api/sales/${id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              selected = data.data;
            }
          }
        } catch (error) {
          console.error('獲取銷售記錄詳細數據失敗:', error);
        }
      }
      
      // 直接設置 selectedSale 狀態
      if (selected) {
        // 使用 useSalesList 中的 selectedSale 狀態
        // 這裡我們不能直接設置 selectedSale，因為它來自 useSalesList hook
        // 但我們可以在 useSalesList 中添加一個 setSelectedSale 函數
        // 暫時使用現有的 handlePreviewClick 函數，但不使用彈出框
        handlePreviewClick({ currentTarget: null } as any, selected);
      }
      
      // 顯示詳情面板
      setShowDetailPanel(true);
    } catch (err) {
      console.error('獲取銷售記錄詳情失敗:', err);
      // 顯示錯誤訊息
      handleCloseSnackbar();
    }
  };

  // 載入中顯示
  if (loading && !sales.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>載入銷售記錄中...</Typography>
      </Box>
    );
  }

  // 定義表格列
  const columns = [
    { field: 'saleNumber', headerName: '銷貨單號', flex: 1.5 },
    {
      field: 'date',
      headerName: '日期',
      flex: 1.3,
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        try {
          // 嘗試將日期字串轉換為可讀格式
          const date = new Date(params.value);
          return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (error) {
          console.error('日期格式化錯誤:', error);
          return params.value;
        }
      }
    },
    {
      field: 'customerName',
      headerName: '客戶',
      flex: 1.5
    },
    {
      field: 'totalAmount',
      headerName: '總金額',
      flex: 1.3,
      valueFormatter: (params: any) => {
        return params.value ? params.value.toLocaleString() : '';
      }
    },
    {
      field: 'paymentMethod',
      headerName: '付款方式',
      flex: 1.1,
      valueFormatter: (params: any) => {
        return getPaymentMethodText(params.value);
      }
    },
    {
      field: 'paymentStatus',
      headerName: '付款狀態',
      flex: 1.1,
      renderCell: (params: any) => (
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
      flex: 2,
      renderCell: (params: any) => {
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* 移除預覽按鈕 */}
            <IconButton
              size="small"
              onClick={() => handleViewSale(params.row._id)}
              title="查看"
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
              onClick={() => handleDeleteSale(params.row._id)}
              title="刪除"
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  // 為DataGrid準備行數據
  const rows = sales.map(sale => {
    // 從 sale 對象中提取所需屬性
    const {
      _id,
      saleNumber,
      date,
      customer,
      totalAmount,
      paymentMethod,
      paymentStatus,
      items,
      notes,
      createdAt,
      updatedAt,
      createdBy,
      status,
      user
    } = sale;
    
    // 創建新對象，避免使用展開運算符
    return {
      id: _id, // DataGrid需要唯一的id字段
      _id, // 保留原始_id用於操作
      saleNumber: saleNumber ?? '無單號',
      date,
      customerName: customer?.name ?? '一般客戶',
      totalAmount: totalAmount ?? 0,
      paymentMethod,
      paymentStatus,
      items,
      notes,
      createdAt,
      updatedAt,
      createdBy,
      status,
      user,
      customer
    };
  });

  // 操作按鈕區域
  const actionButtons = (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          placeholder="搜索銷售記錄（單號、客戶、日期）"
          value={searchTerm}
          onChange={handleSearchChange}
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
                <IconButton
                  size="small"
                  onClick={() => handleSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                  edge="end"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <IconButton
          value="wildcard"
          onClick={() => handleWildcardModeChange(!wildcardMode)}
          size="small"
          color={wildcardMode ? "primary" : "default"}
          title={wildcardMode ? "切換到一般搜尋" : "切換到萬用字元搜尋"}
        >
          <FilterAltIcon />
        </IconButton>
        <WildcardSearchHelp />
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddNewSale}
        >
          新增銷售 {isTestMode && "(模擬)"}
        </Button>
      </Box>
    </Box>
  );

  // 詳情面板
  const detailPanel = showDetailPanel ? (
    <SalesDetailPanel
      selectedSale={selectedSale}
    />
  ) : (
    <Card
      elevation={2}
      className="sales-card"
      sx={{
        borderRadius: '0.5rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6
        },
        '&:hover .arrow-icon': {
          animation: `${arrowBounce} 0.8s infinite`,
          color: 'primary.dark'
        }
      }}
    >
      <CardContent sx={{ textAlign: 'center', py: 3, width: '100%' }}>
        {/* 大型銷售圖標 */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <PointOfSaleIcon
            color="primary"
            sx={{
              fontSize: '4rem',
              mb: 1,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1)',
                color: 'primary.dark'
              }
            }}
          />
        </Box>
        
        {/* 內容區域 */}
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'center' }}>
            <ArrowBackIcon
              color="primary"
              className="arrow-icon"
              sx={{
                fontSize: '2rem',
                mr: 1,
                transform: 'translateX(-10px)',
                animation: 'arrowPulse 1.5s infinite',
                transition: 'color 0.3s ease'
              }}
            />
            <Typography variant="body1" color="primary.main" sx={{ fontWeight: 500 }}>
              左側列表
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            選擇一個銷售記錄查看詳情
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            請從左側列表中選擇一個銷售記錄
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '95%', mx: 'auto' }}>
      <CommonListPageLayout
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TitleWithCount title="銷售管理" count={sales.length} />
            {/* 總金額顯示 */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              minWidth: 'fit-content'
            }}>
              <Typography variant="caption" sx={{ fontSize: '0.8rem', mr: 1 }}>
                總計
              </Typography>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                ${totalAmount.toLocaleString()}
              </Typography>
            </Box>
            {isTestMode && (
              <Chip
                label="測試模式"
                color="warning"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            )}
          </Box>
        }
        actionButtons={actionButtons}
        columns={columns}
        rows={rows}
        loading={loading}
        {...(error && { error })}
        onRowClick={(params) => selectSale(params.row._id)}
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
              sortModel: [{ field: 'saleNumber', sort: 'desc' }],
            },
          },
          getRowId: (row: any) => row.id,
          sx: {
            // 自定義滾動條樣式
            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': {
              width: '4px',
              height: '4px',
            },
            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': {
              background: '#ffffff02',
            },
            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': {
              background: '#a7a7a796',
              borderRadius: '4px',
            },
          }
        }}
      />

      {/* 移除 SalesPreviewPopover 組件 */}

      <DeleteConfirmDialog
        open={!!confirmDeleteId}
        saleId={confirmDeleteId}
        isTestMode={isTestMode}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleDeleteSale}
      />

      <NotificationSnackbar
        snackbar={snackbar}
        onClose={handleCloseSnackbar}
      />
    </Box>
  );
};

export default SalesListPage;