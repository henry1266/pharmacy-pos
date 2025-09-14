/**
 * @file 銷售列表頁面
 * @description 顯示銷售記錄列表，提供搜尋、瀏覽、編輯與刪除功能
 */

import React, { FC, useState, useEffect } from 'react';
import { keyframes } from '@emotion/react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Card,
  CardContent,
  Chip,
  CircularProgress
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
import DeleteConfirmDialog from '../components/list/DeleteConfirmDialog';
import NotificationSnackbar from '../components/list/NotificationSnackbar';
import CommonListPageLayout from '@/components/common/CommonListPageLayout';
import TitleWithCount from '@/components/common/TitleWithCount';
import SalesDetailPanel from '../components/detail/SalesDetailPanel';
import WildcardSearchHelp from '@/components/common/WildcardSearchHelp';
import { getPaymentMethodText, getPaymentStatusInfo } from '../utils/listUtils';
import { useGetSaleByIdQuery } from '../api/saleApi';

// 箭頭動畫
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
    isTestMode,
    sales,
    loading,
    error,
    searchTerm,
    wildcardMode,
    confirmDeleteId,
    snackbar,
    selectedSale,
    totalAmount,

    handleSearchChange,
    handleWildcardModeChange,
    handleDeleteSale,
    handleCloseConfirmDialog,
    handleCloseSnackbar,
    handlePreviewClick,
    handleAddNewSale,
    handleEditSale,
    handleViewSale,
  } = useSalesList();

  // 詳細面板顯示與資料
  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(false);
  const [selectedIdForDetail, setSelectedIdForDetail] = useState<string | null>(null);
  const { data: selectedSaleData } = useGetSaleByIdQuery(selectedIdForDetail as string, { skip: !selectedIdForDetail });

  const handleRowClickSelect = (id: string) => {
    const selected = sales.find(sale => sale._id === id);
    if (selected && (selected as any).items) {
      handlePreviewClick({ currentTarget: null } as any, selected as Sale);
      setShowDetailPanel(true);
      return;
    }
    setSelectedIdForDetail(id);
    setShowDetailPanel(true);
  };

  useEffect(() => {
    if (selectedSaleData && (selectedSaleData as any).data) {
      const sale = (selectedSaleData as any).data ?? selectedSaleData;
      handlePreviewClick({ currentTarget: null } as any, sale as Sale);
    }
  }, [selectedSaleData, handlePreviewClick]);

  // 載入中顯示
  if (loading && !sales.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>載入銷售記錄中...</Typography>
      </Box>
    );
  }

  // 定義表格欄位
  const columns = [
    { field: 'saleNumber', headerName: '銷貨單號', flex: 1.5 },
    {
      field: 'date',
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
    { field: 'customerName', headerName: '客戶', flex: 1.5 },
    {
      field: 'totalAmount',
      headerName: '總金額',
      flex: 1.3,
      valueFormatter: (params: any) => (params.value ? params.value.toLocaleString() : ''),
    },
    { field: 'paymentMethod', headerName: '付款方式', flex: 1.1, valueFormatter: (p: any) => getPaymentMethodText(p.value) },
    {
      field: 'paymentStatus',
      headerName: '付款狀態',
      flex: 1.1,
      renderCell: (params: any) => (
        <Chip label={getPaymentStatusInfo(params.value).text} color={getPaymentStatusInfo(params.value).color} size="small" />
      )
    },
    {
      field: 'actions',
      headerName: '操作',
      flex: 2,
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => handleViewSale(params.row._id)} title="檢視">
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleEditSale(params.row._id)} title="編輯">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDeleteSale(params.row._id)} title="刪除" color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  // DataGrid 資料列
  const rows = sales.map((sale) => {
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
    } = sale as any;

    return {
      id: _id,
      _id,
      saleNumber: saleNumber ?? '未指定',
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

  // 操作區塊
  const actionButtons = (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          placeholder="搜尋銷售記錄（單號、客戶、日期）"
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
                <IconButton size="small" onClick={() => handleSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)} edge="end">
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
          color={wildcardMode ? 'primary' : 'default'}
          title={wildcardMode ? '關閉萬用字元搜尋' : '開啟萬用字元搜尋'}
        >
          <FilterAltIcon />
        </IconButton>
        <WildcardSearchHelp />
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAddNewSale}>
          新增銷售 {isTestMode && '(模擬)'}
        </Button>
      </Box>
    </Box>
  );

  // 詳細面板
  const detailPanel = showDetailPanel ? (
    <SalesDetailPanel selectedSale={selectedSale} />
  ) : (
    <Card elevation={2} className="sales-card" sx={{ borderRadius: '0.5rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s ease', '&:hover': { boxShadow: 6 }, '&:hover .arrow-icon': { animation: `${arrowBounce} 0.8s infinite`, color: 'primary.dark' } }}>
      <CardContent sx={{ textAlign: 'center', py: 3, width: '100%' }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <PointOfSaleIcon color="primary" sx={{ fontSize: '4rem', mb: 1, transition: 'all 0.3s ease', '&:hover': { transform: 'scale(1.1)', color: 'primary.dark' } }} />
        </Box>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'center' }}>
            <ArrowBackIcon color="primary" className="arrow-icon" sx={{ fontSize: '2rem', mr: 1, transform: 'translateX(-10px)', animation: 'arrowPulse 1.5s infinite', transition: 'color 0.3s ease' }} />
            <Typography variant="body1" color="primary.main" sx={{ fontWeight: 500 }}>
              從左側列表選擇
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            點選任一銷售以查看詳情
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
            {/* 總額顯示 */}
            <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: 'primary.main', color: 'primary.contrastText', px: 2, py: 0.5, borderRadius: 2, minWidth: 'fit-content' }}>
              <Typography variant="caption" sx={{ fontSize: '0.8rem', mr: 1 }}>
                總額
              </Typography>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                ${totalAmount.toLocaleString()}
              </Typography>
            </Box>
            {isTestMode && (
              <Chip label="測試模式" color="warning" size="small" sx={{ fontWeight: 'bold' }} />
            )}
          </Box>
        }
        actionButtons={actionButtons}
        columns={columns}
        rows={rows}
        loading={loading}
        {...(error && { error })}
        onRowClick={(params: any) => handleRowClickSelect(params.row._id)}
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
          sx: {}
        }}
      />

      <DeleteConfirmDialog
        open={!!confirmDeleteId}
        saleId={confirmDeleteId}
        isTestMode={isTestMode}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleDeleteSale}
      />

      <NotificationSnackbar snackbar={snackbar} onClose={handleCloseSnackbar} />
    </Box>
  );
};

export default SalesListPage;

