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
  Fab,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Popper
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

import { fetchPurchaseOrders, deletePurchaseOrder, searchPurchaseOrders, fetchSuppliers } from '../redux/actions';
import PurchaseOrderPreview from '../components/purchase-orders/PurchaseOrderPreview';
import SupplierCheckboxFilter from '../components/filters/SupplierCheckboxFilter';

const PurchaseOrdersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { purchaseOrders, loading, error } = useSelector(state => state.purchaseOrders);
  const { suppliers } = useSelector(state => state.suppliers || { suppliers: [] });
  
  const [searchParams, setSearchParams] = useState({
    poid: '',
    pobill: '',
    posupplier: '',
    startDate: null,
    endDate: null
  });
  
  // 供應商篩選相關狀態
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseOrderToDelete, setPurchaseOrderToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // 預覽相關狀態
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAnchorEl, setPreviewAnchorEl] = useState(null);
  const [previewPurchaseOrder, setPreviewPurchaseOrder] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  
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
    pageSize: 50,
    page: 0,
  });
  
  useEffect(() => {
    dispatch(fetchPurchaseOrders());
    dispatch(fetchSuppliers());
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
  
  // 處理供應商篩選變更
  useEffect(() => {
    if (purchaseOrders.length > 0) {
      let filtered = [...purchaseOrders];
      
      // 如果有選擇供應商，則進行篩選
      if (selectedSuppliers.length > 0) {
        filtered = filtered.filter(po => selectedSuppliers.includes(po.posupplier));
      }
      
      // 將篩選後的數據轉換為DataGrid需要的格式
      const formattedRows = filtered.map(po => ({
        id: po._id,
        _id: po._id,
        poid: po.poid,
        pobill: po.pobill,
        pobilldate: po.pobilldate,
        posupplier: po.posupplier,
        totalAmount: po.totalAmount,
        status: po.status,
        paymentStatus: po.paymentStatus
      }));
      
      setFilteredRows(formattedRows);
    } else {
      setFilteredRows([]);
    }
  }, [purchaseOrders, selectedSuppliers]);
  
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
  
  // 處理供應商篩選變更
  const handleSupplierFilterChange = (suppliers) => {
    setSelectedSuppliers(suppliers);
  };
  
  // 處理滑鼠懸停在檢視按鈕上
  const handlePreviewMouseEnter = async (event, id) => {
    setPreviewAnchorEl(event.currentTarget);
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    
    try {
      // 從現有的purchaseOrders中查找，如果找到就直接使用
      const existingPO = purchaseOrders.find(po => po._id === id);
      if (existingPO && existingPO.items) {
        setPreviewPurchaseOrder(existingPO);
        setPreviewLoading(false);
        return;
      }
      
      // 如果在現有數據中沒有找到完整信息，則從API獲取
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const response = await axios.get(`/api/purchase-orders/${id}`, config);
      setPreviewPurchaseOrder(response.data);
      setPreviewLoading(false);
    } catch (err) {
      console.error('獲取進貨單預覽失敗:', err);
      setPreviewError('獲取進貨單預覽失敗');
      setPreviewLoading(false);
    }
  };
  
  // 處理滑鼠離開檢視按鈕
  const handlePreviewMouseLeave = () => {
    setPreviewOpen(false);
    setPreviewAnchorEl(null);
    setPreviewPurchaseOrder(null);
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
  
  // 自定義供應商列頭渲染函數
  const renderSupplierHeader = () => {
    return (
      <SupplierCheckboxFilter
        suppliers={suppliers}
        selectedSuppliers={selectedSuppliers}
        onFilterChange={handleSupplierFilterChange}
      />
    );
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
    { 
      field: 'posupplier', 
      headerName: '供應商', 
      flex: 1,
      renderHeader: renderSupplierHeader
    },
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
          <IconButton 
            size="small" 
            onClick={() => handleView(params.row._id)}
            onMouseEnter={(e) => handlePreviewMouseEnter(e, params.row._id)}
            onMouseLeave={handlePreviewMouseLeave}
          >
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
          <Box sx={{ width: '100%' }}>
            <DataGrid
              rows={filteredRows.length > 0 ? filteredRows : rows}
              columns={columns}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[5, 10, 25, 50]}
              checkboxSelection={false}
              disableRowSelectionOnClick
              loading={loading}
              autoHeight
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
      
      {/* 進貨單預覽彈出窗口 */}
      <Popper
        open={previewOpen}
        anchorEl={previewAnchorEl}
        placement="right-start"
        sx={{ zIndex: 1300 }}
      >
        <PurchaseOrderPreview
          purchaseOrder={previewPurchaseOrder}
          loading={previewLoading}
          error={previewError}
        />
      </Popper>
      
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
                匯入進貨單基本資訊
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                請上傳包含進貨單基本資訊的CSV文件。文件應包含以下欄位：進貨單號、發票號碼、發票日期、供應商、狀態、付款狀態等。
              </Typography>
            </Box>
          )}
          
          {csvTabValue === 1 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                匯入進貨品項
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                請上傳包含進貨品項的CSV文件。文件應包含以下欄位：進貨單號、藥品代碼、藥品名稱、數量、總成本等。
              </Typography>
            </Box>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              component="label"
              startIcon={<CloudUploadIcon />}
              disabled={csvImportLoading}
            >
              選擇CSV文件
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={handleCsvFileChange}
              />
            </Button>
            {csvFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                已選擇: {csvFile.name}
              </Typography>
            )}
          </Box>
          
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
          
          {csvImportLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCsvImportDialogOpen(false)}>取消</Button>
          <Button 
            onClick={handleCsvImport} 
            variant="contained" 
            disabled={!csvFile || csvImportLoading}
          >
            匯入
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseOrdersPage;
