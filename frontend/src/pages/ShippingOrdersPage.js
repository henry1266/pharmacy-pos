import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Tooltip,
  Fab,
  Snackbar,
  Alert,
  Popper
} from '@mui/material';
import { 
  Add as AddIcon, 
  FilterList as FilterListIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

// 導入API基礎URL
import { API_BASE_URL } from '../redux/actions';

import { fetchShippingOrders, deleteShippingOrder, searchShippingOrders, fetchSuppliers } from '../redux/actions';
import ShippingOrderPreview from '../components/shipping-orders/ShippingOrderPreview';
import SupplierCheckboxFilter from '../components/filters/SupplierCheckboxFilter';
import ShippingOrdersTable from '../components/shipping-orders/list/ShippingOrdersTable';
import ShippingOrdersFilter from '../components/shipping-orders/list/ShippingOrdersFilter';
import CsvImportDialog from '../components/shipping-orders/import/CsvImportDialog';
import DeleteConfirmDialog from '../components/shipping-orders/common/ConfirmDialog';
import FilterPriceSummary from '../components/common/FilterPriceSummary';

/**
 * 出貨單管理頁面
 * @returns {React.ReactElement} 出貨單管理頁面
 */
const ShippingOrdersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { shippingOrders, loading, error } = useSelector(state => state.shippingOrders);
  const { suppliers } = useSelector(state => state.suppliers || { suppliers: [] });
  
  const [searchParams, setSearchParams] = React.useState({
    soid: '',
    sobill: '',
    sosupplier: '',
    startDate: null,
    endDate: null
  });
  
  // 供應商篩選相關狀態
  const [selectedSuppliers, setSelectedSuppliers] = React.useState([]);
  const [filteredRows, setFilteredRows] = React.useState([]);
  
  const [showFilters, setShowFilters] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [shippingOrderToDelete, setShippingOrderToDelete] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // 預覽相關狀態
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewAnchorEl, setPreviewAnchorEl] = React.useState(null);
  const [previewShippingOrder, setPreviewShippingOrder] = React.useState(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewError, setPreviewError] = React.useState(null);
  
  // CSV導入相關狀態
  const [csvImportDialogOpen, setCsvImportDialogOpen] = React.useState(false);
  const [csvType, setCsvType] = React.useState('basic'); // 'basic' 或 'items'
  const [csvFile, setCsvFile] = React.useState(null);
  const [csvImportLoading, setCsvImportLoading] = React.useState(false);
  const [csvImportError, setCsvImportError] = React.useState(null);
  const [csvImportSuccess, setCsvImportSuccess] = React.useState(false);
  const [csvTabValue, setCsvTabValue] = React.useState(0);
  
  // DataGrid 分頁設置
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 50,
    page: 0,
  });
  
  React.useEffect(() => {
    dispatch(fetchShippingOrders());
    dispatch(fetchSuppliers());
  }, [dispatch]);
  
  React.useEffect(() => {
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: 'error'
      });
    }
  }, [error]);
  
  // 處理供應商篩選變更
  React.useEffect(() => {
    if (shippingOrders.length > 0) {
      let filtered = [...shippingOrders];
      
      // 如果有選擇供應商，則進行篩選
      if (selectedSuppliers.length > 0) {
        filtered = filtered.filter(so => selectedSuppliers.includes(so.sosupplier));
      }
      
      // 將篩選後的數據轉換為DataGrid需要的格式
      const formattedRows = filtered.map(so => ({
        id: so._id,
        _id: so._id,
        soid: so.soid,
        sobill: so.sobill,
        sobilldate: so.sobilldate,
        sosupplier: so.sosupplier,
        totalAmount: so.totalAmount,
        status: so.status,
        paymentStatus: so.paymentStatus
      }));
      
      setFilteredRows(formattedRows);
    } else {
      setFilteredRows([]);
    }
  }, [shippingOrders, selectedSuppliers]);
  
  const handleSearch = () => {
    dispatch(searchShippingOrders(searchParams));
  };
  
  const handleClearSearch = () => {
    setSearchParams({
      soid: '',
      sobill: '',
      sosupplier: '',
      startDate: null,
      endDate: null
    });
    dispatch(fetchShippingOrders());
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
    navigate('/shipping-orders/new');
  };
  
  const handleEdit = (id) => {
    navigate(`/shipping-orders/edit/${id}`);
  };
  
  const handleView = (id) => {
    navigate(`/shipping-orders/${id}`);
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
      // 從現有的shippingOrders中查找，如果找到就直接使用
      const existingSO = shippingOrders.find(so => so._id === id);
      if (existingSO && existingSO.items) {
        setPreviewShippingOrder(existingSO);
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
      
      const response = await axios.get(`${API_BASE_URL}/shipping-orders/${id}`.replace('/api/api', '/api'), config);
      setPreviewShippingOrder(response.data);
      setPreviewLoading(false);
    } catch (err) {
      console.error('獲取出貨單預覽失敗:', err);
      setPreviewError('獲取出貨單預覽失敗');
      setPreviewLoading(false);
    }
  };
  
  // 處理滑鼠離開檢視按鈕
  const handlePreviewMouseLeave = () => {
    setPreviewOpen(false);
    setPreviewAnchorEl(null);
    setPreviewShippingOrder(null);
  };
  
  const handleDeleteClick = (shippingOrder) => {
    setShippingOrderToDelete(shippingOrder);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = () => {
    if (shippingOrderToDelete) {
      dispatch(deleteShippingOrder(shippingOrderToDelete._id));
      setDeleteDialogOpen(false);
      setShippingOrderToDelete(null);
      setSnackbar({
        open: true,
        message: '出貨單已成功刪除',
        severity: 'success'
      });
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setShippingOrderToDelete(null);
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
        ? `${API_BASE_URL}/shipping-orders/import/basic`.replace('/api/api', '/api')
        : `${API_BASE_URL}/shipping-orders/import/items`.replace('/api/api', '/api');
      
      const response = await axios.post(endpoint, formData, config);
      
      // 更新出貨單列表
      dispatch(fetchShippingOrders());
      
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
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        出貨單管理
      </Typography>
      
      <Card sx={{ mb: 3, px: 2, mx: 1 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">出貨單列表</Typography>
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
            <ShippingOrdersFilter
              searchParams={searchParams}
              handleInputChange={handleInputChange}
              handleDateChange={handleDateChange}
              handleSearch={handleSearch}
              handleClearSearch={handleClearSearch}
            />
          )}
          
          {/* 篩選價格加總 */}
          {filteredRows.length > 0 && (
            <FilterPriceSummary 
              filteredRows={filteredRows}
              totalAmountField="totalAmount"
              title="篩選結果"
            />
          )}
          
          {/* DataGrid表格 */}
          <ShippingOrdersTable
            shippingOrders={shippingOrders}
            filteredRows={filteredRows}
            paginationModel={paginationModel}
            setPaginationModel={setPaginationModel}
            loading={loading}
            handleView={handleView}
            handleEdit={handleEdit}
            handleDeleteClick={handleDeleteClick}
            handlePreviewMouseEnter={handlePreviewMouseEnter}
            handlePreviewMouseLeave={handlePreviewMouseLeave}
            renderSupplierHeader={renderSupplierHeader}
          />
        </CardContent>
      </Card>
      
      {/* 出貨單預覽彈出窗口 */}
      <Popper
        open={previewOpen}
        anchorEl={previewAnchorEl}
        placement="right-start"
        sx={{ zIndex: 1300 }}
      >
        <ShippingOrderPreview
          shippingOrder={previewShippingOrder}
          loading={previewLoading}
          error={previewError}
        />
      </Popper>
      
      {/* 固定按鈕區域 */}
      <Box
        sx={{
          position: 'fixed',
          right: 5,
          top: '40%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1000
        }}
      >
        <Tooltip title="新增出貨單" placement="left" arrow>
          <Fab
            color="primary"
            size="medium"
            onClick={handleAddNew}
            aria-label="新增出貨單"
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
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        shippingOrder={shippingOrderToDelete}
      />
      
      {/* CSV導入對話框 */}
      <CsvImportDialog
        open={csvImportDialogOpen}
        onClose={() => setCsvImportDialogOpen(false)}
        tabValue={csvTabValue}
        onTabChange={handleCsvTabChange}
        csvFile={csvFile}
        onFileChange={handleCsvFileChange}
        onImport={handleCsvImport}
        loading={csvImportLoading}
        error={csvImportError}
        success={csvImportSuccess}
      />
      
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

export default ShippingOrdersPage;
