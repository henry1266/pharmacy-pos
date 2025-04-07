import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Paper, 
  TextField,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
  Fab
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

import { fetchPurchaseOrders, deletePurchaseOrder, searchPurchaseOrders } from '../redux/actions';

const PurchaseOrdersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { purchaseOrders, loading, error } = useSelector(state => state.purchaseOrders);
  
  const [searchParams, setSearchParams] = useState({
    poid: '',
    pobill: '',
    posupplier: '',
    startDate: null,
    endDate: null
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseOrderToDelete, setPurchaseOrderToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // CSV導入相關狀態
  const [csvImportDialogOpen, setCsvImportDialogOpen] = useState(false);
  const [csvType, setCsvType] = useState('basic'); // 'basic' 或 'items'
  const [csvFile, setCsvFile] = useState(null);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const [csvImportError, setCsvImportError] = useState(null);
  const [csvImportSuccess, setCsvImportSuccess] = useState(false);
  const [csvTabValue, setCsvTabValue] = useState(0);
  
  // DataGrid 分頁設置
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  
  useEffect(() => {
    dispatch(fetchPurchaseOrders());
  }, [dispatch]);
  
  useEffect(() => {
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: 'error'
      });
    }
  }, [error]);
  
  const handleSearch = () => {
    dispatch(searchPurchaseOrders(searchParams));
  };
  
  const handleClearSearch = () => {
    setSearchParams({
      poid: '',
      pobill: '',
      posupplier: '',
      startDate: null,
      endDate: null
    });
    dispatch(fetchPurchaseOrders());
  };
  
  const handleInputChange = (e) => {
    setSearchParams({
      ...searchParams,
      [e.target.name]: e.target.value
    });
  };
  
  const handleDateChange = (name, date) => {
    setSearchParams({
      ...searchParams,
      [name]: date
    });
  };
  
  const handleAddNew = () => {
    navigate('/purchase-orders/new');
  };
  
  const handleEdit = (id) => {
    navigate(`/purchase-orders/edit/${id}`);
  };
  
  const handleView = (id) => {
    navigate(`/purchase-orders/${id}`);
  };
  
  const handleDeleteClick = (purchaseOrder) => {
    setPurchaseOrderToDelete(purchaseOrder);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = () => {
    if (purchaseOrderToDelete) {
      dispatch(deletePurchaseOrder(purchaseOrderToDelete._id));
      setDeleteDialogOpen(false);
      setPurchaseOrderToDelete(null);
      setSnackbar({
        open: true,
        message: '進貨單已成功刪除',
        severity: 'success'
      });
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPurchaseOrderToDelete(null);
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  // 處理打開CSV導入對話框
  const handleOpenCsvImport = () => {
    setCsvFile(null);
    setCsvImportError(null);
    setCsvImportSuccess(false);
    setCsvImportDialogOpen(true);
  };
  
  // 處理CSV標籤頁切換
  const handleCsvTabChange = (event, newValue) => {
    setCsvTabValue(newValue);
    setCsvType(newValue === 0 ? 'basic' : 'items');
    setCsvFile(null);
    setCsvImportError(null);
  };
  
  // 處理CSV文件選擇
  const handleCsvFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setCsvImportError(null);
    }
  };
  
  // 處理CSV導入
  const handleCsvImport = async () => {
    if (!csvFile) {
      setCsvImportError('請選擇CSV文件');
      return;
    }
    
    try {
      setCsvImportLoading(true);
      setCsvImportError(null);
      
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('type', csvType);
      
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      };
      
      // 根據CSV類型選擇不同的API端點
      const endpoint = csvType === 'basic' 
        ? '/api/purchase-orders/import/basic'
        : '/api/purchase-orders/import/items';
      
      const response = await axios.post(endpoint, formData, config);
      
      // 更新進貨單列表
      dispatch(fetchPurchaseOrders());
      
      setCsvImportSuccess(true);
      setCsvImportLoading(false);
      
      // 顯示成功消息
      setSnackbar({
        open: true,
        message: response.data.msg || 'CSV導入成功',
        severity: 'success'
      });
      
      // 3秒後關閉對話框
      setTimeout(() => {
        setCsvImportDialogOpen(false);
        setCsvImportSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('CSV導入錯誤:', err);
      setCsvImportError(err.response?.data?.msg || '導入失敗，請檢查CSV格式');
      setCsvImportLoading(false);
    }
  };
  
  const getStatusChip = (status) => {
    let color = 'default';
    let label = '未知';
    
    switch (status) {
      case 'pending':
        color = 'warning';
        label = '處理中';
        break;
      case 'completed':
        color = 'success';
        label = '已完成';
        break;
      case 'cancelled':
        color = 'error';
        label = '已取消';
        break;
      default:
        break;
    }
    
    return <Chip size="small" color={color} label={label} />;
  };
  
  const getPaymentStatusChip = (status) => {
    let color = 'default';
    let label = status || '未付';
    
    switch (status) {
      case '未付':
        color = 'warning';
        break;
      case '已下收':
        color = 'info';
        break;
      case '已匯款':
        color = 'success';
        break;
      default:
        break;
    }
    
    return <Chip size="small" color={color} label={label} />;
  };
  
  // DataGrid 列定義
  const columns = [
    { field: 'poid', headerName: '進貨單號', flex: 1 },
    { field: 'pobill', headerName: '發票號碼', flex: 1 },
    { 
      field: 'pobilldate', 
      headerName: '發票日期', 
      flex: 1,
      valueFormatter: (params) => {
        return params.value ? format(new Date(params.value), 'yyyy-MM-dd') : '';
      }
    },
    { field: 'posupplier', headerName: '供應商', flex: 1 },
    { 
      field: 'totalAmount', 
      headerName: '總金額', 
      flex: 1,
      valueFormatter: (params) => {
        return params.value ? params.value.toLocaleString() : '';
      }
    },
    { 
      field: 'status', 
      headerName: '狀態', 
      flex: 1,
      renderCell: (params) => getStatusChip(params.value)
    },
    { 
      field: 'paymentStatus', 
      headerName: '付款狀態', 
      flex: 1,
      renderCell: (params) => getPaymentStatusChip(params.value)
    },
    { 
      field: 'actions', 
      headerName: '操作', 
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => handleView(params.row._id)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleEdit(params.row._id)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleDeleteClick(params.row)}
            disabled={params.row.status === 'completed'}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];
  
  // 為DataGrid準備行數據
  const rows = purchaseOrders.map(po => ({
    id: po._id, // DataGrid需要唯一的id字段
    _id: po._id, // 保留原始_id用於操作
    poid: po.poid,
    pobill: po.pobill,
    pobilldate: po.pobilldate,
    posupplier: po.posupplier,
    totalAmount: po.totalAmount,
    status: po.status,
    paymentStatus: po.paymentStatus
  }));
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        進貨單管理
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">進貨單列表</Typography>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<FilterListIcon />} 
                onClick={() => setShowFilters(!showFilters)}
                sx={{ mr: 1 }}
              >
                {showFilters ? '隱藏篩選' : '顯示篩選'}
              </Button>
            </Box>
          </Box>
          
          {showFilters && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="進貨單號"
                  name="poid"
                  value={searchParams.poid}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="發票號碼"
                  name="pobill"
                  value={searchParams.pobill}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="供應商"
                  name="posupplier"
                  value={searchParams.posupplier}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
                  <DatePicker
                    label="開始日期"
                    value={searchParams.startDate}
                    onChange={(date) => handleDateChange('startDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
                  <DatePicker
                    label="結束日期"
                    value={searchParams.endDate}
                    onChange={(date) => handleDateChange('endDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SearchIcon />}
                    onClick={handleSearch}
                  >
                    搜尋
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={handleClearSearch}
                  >
                    清除
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
          
          {/* DataGrid表格 */}
          <Box sx={{ width: '100%', height: 500 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[5, 10, 25, 50]}
              checkboxSelection={false}
              disableRowSelectionOnClick
              loading={loading}
              density="standard"
              getRowId={(row) => row.id}
              localeText={{
                noRowsLabel: '沒有進貨單記錄',
                footerRowSelected: (count) => `已選擇 ${count} 個項目`,
                columnMenuLabel: '選單',
                columnMenuShowColumns: '顯示欄位',
                columnMenuFilter: '篩選',
                columnMenuHideColumn: '隱藏',
                columnMenuUnsort: '取消排序',
                columnMenuSortAsc: '升序排列',
                columnMenuSortDesc: '降序排列',
                filterPanelAddFilter: '新增篩選',
                filterPanelDeleteIconLabel: '刪除',
                filterPanelOperators: '運算子',
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
                paginationLabelDisplayedRows: ({ from, to, count }) => `${from}-${to} / ${count !== -1 ? count : `超過 ${to}`}`,
                paginationLabelRowsPerPage: '每頁行數:',
                MuiTablePagination: {
                  labelDisplayedRows: ({ from, to, count }) => `${from}-${to} / ${count}`,
                  labelRowsPerPage: '每頁行數:'
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>
      
      {/* 固定按鈕區域 */}
      <Box
        sx={{
          position: 'fixed',
          right: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1000
        }}
      >
        <Tooltip title="新增進貨單" placement="left" arrow>
          <Fab
            color="primary"
            size="medium"
            onClick={handleAddNew}
            aria-label="新增進貨單"
          >
            <AddIcon />
          </Fab>
        </Tooltip>
        <Tooltip title="CSV匯入" placement="left" arrow>
          <Fab
            color="secondary"
            size="medium"
            onClick={handleOpenCsvImport}
            aria-label="CSV匯入"
          >
            <CloudUploadIcon />
          </Fab>
        </Tooltip>
      </Box>
      
      {/* 刪除確認對話框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您確定要刪除進貨單 "{purchaseOrderToDelete?.poid}" 嗎？此操作無法撤銷。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>取消</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            刪除
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* CSV導入對話框 */}
      <Dialog
        open={csvImportDialogOpen}
        onClose={() => setCsvImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>CSV匯入進貨單</DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={csvTabValue} onChange={handleCsvTabChange}>
              <Tab label="進貨單基本資訊" />
              <Tab label="進貨品項" />
            </Tabs>
          </Box>
          
          {csvTabValue === 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                請上傳進貨單基本資訊CSV文件
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                CSV格式要求：進貨單號,發票號,發票日期,廠商,付款狀態<br />
                範例：20240816001,DA84143639,20240813,嘉鏵,已下收
              </Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{ mt: 1, mb: 2 }}
              >
                選擇文件
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={handleCsvFileChange}
                />
              </Button>
              {csvFile && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  已選擇文件: {csvFile.name}
                </Typography>
              )}
            </Box>
          )}
          
          {csvTabValue === 1 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                請上傳進貨品項CSV文件
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                CSV格式要求：進貨單號,藥品代碼,數量,金額<br />
                範例：20240816001,80002,70,140<br />
                注意：請確保進貨單號已存在於系統中
              </Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{ mt: 1, mb: 2 }}
              >
                選擇文件
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={handleCsvFileChange}
                />
              </Button>
              {csvFile && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  已選擇文件: {csvFile.name}
                </Typography>
              )}
            </Box>
          )}
          
          {csvImportError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {csvImportError}
            </Alert>
          )}
          
          {csvImportSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              CSV導入成功！
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCsvImportDialogOpen(false)} color="inherit">
            取消
          </Button>
          <Button 
            onClick={handleCsvImport} 
            color="primary" 
            variant="contained"
            disabled={!csvFile || csvImportLoading}
          >
            {csvImportLoading ? <CircularProgress size={24} /> : '導入'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 提示訊息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseOrdersPage;
