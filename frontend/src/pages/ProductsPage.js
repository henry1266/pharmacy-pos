import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Avatar,
  List,
  ListItem,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DataTable from '../components/tables/DataTable';

// 產品類型標籤面板
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProductsPage = () => {
  // 狀態管理
  const [products, setProducts] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    code: '',
    shortCode: '',
    name: '',
    category: '',
    unit: '',
    purchasePrice: 0,
    sellingPrice: 0,
    description: '',
    supplier: '',
    minStock: 10,
    // 商品特有屬性
    barcode: '',
    // 藥品特有屬性
    healthInsuranceCode: '',
    healthInsurancePrice: 0
  });
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [productType, setProductType] = useState('product');
  // 庫存相關狀態
  const [inventory, setInventory] = useState([]);
  const [productInventory, setProductInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  
  // CSV匯入相關狀態
  const [openCsvDialog, setOpenCsvDialog] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const [csvImportError, setCsvImportError] = useState(null);
  const [csvImportSuccess, setCsvImportSuccess] = useState(false);

  // 計算產品總庫存數量
  const getTotalInventory = (productId) => {
    if (!productId || inventoryLoading) return '載入中...';
    
    // 直接查找與產品ID匹配的庫存記錄
    const productInv = inventory.filter(item => 
      item.product && (item.product._id === productId || item.product === productId)
    );
    
    if (productInv.length === 0) return '0';
    
    const total = productInv.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    return total.toString();
  };

  // 表格列定義 - 商品
  const productColumns = [
    { field: 'code', headerName: '商品編號', width: 120 },
    { field: 'shortCode', headerName: '簡碼', width: 100 },
    { field: 'name', headerName: '商品名稱', width: 180 },
    { field: 'barcode', headerName: '國際條碼', width: 150 },
    { field: 'category', headerName: '分類', width: 120 },
    { field: 'unit', headerName: '單位', width: 80 },
    { 
      field: 'inventory', 
      headerName: '庫存', 
      width: 80, 
      valueGetter: (params) => getTotalInventory(params.row.id),
      renderCell: (params) => {
        const inventoryValue = getTotalInventory(params.row.id);
        const minStock = params.row.minStock || 0;
        let color = 'success.main';
        
        if (inventoryValue === '0') {
          color = 'error.main';
        } else if (inventoryValue !== '載入中...' && parseInt(inventoryValue) < minStock) {
          color = 'warning.main';
        }
        
        return (
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 500,
              color: color
            }}
          >
            {inventoryValue}
          </Typography>
        );
      }
    },
    { field: 'purchasePrice', headerName: '進貨價', width: 100, type: 'number' },
    { field: 'sellingPrice', headerName: '售價', width: 100, type: 'number' },
    {
      field: 'actions',
      headerName: '操作',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton
            color="primary"
            onClick={() => handleEditProduct(params.row.id, 'product')}
            size="small"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDeleteProduct(params.row.id)}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  // 表格列定義 - 藥品
  const medicineColumns = [
    { field: 'code', headerName: '藥品編號', width: 120 },
    { field: 'shortCode', headerName: '簡碼', width: 100 },
    { field: 'name', headerName: '藥品名稱', width: 180 },
    { field: 'healthInsuranceCode', headerName: '健保碼', width: 120 },
    { field: 'healthInsurancePrice', headerName: '健保價', width: 100, type: 'number' },
    { field: 'category', headerName: '分類', width: 120 },
    { field: 'unit', headerName: '單位', width: 80 },
    { 
      field: 'inventory', 
      headerName: '庫存', 
      width: 80, 
      valueGetter: (params) => getTotalInventory(params.row.id),
      renderCell: (params) => {
        const inventoryValue = getTotalInventory(params.row.id);
        const minStock = params.row.minStock || 0;
        let color = 'success.main';
        
        if (inventoryValue === '0') {
          color = 'error.main';
        } else if (inventoryValue !== '載入中...' && parseInt(inventoryValue) < minStock) {
          color = 'warning.main';
        }
        
        return (
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 500,
              color: color
            }}
          >
            {inventoryValue}
          </Typography>
        );
      }
    },
    { field: 'purchasePrice', headerName: '進貨價', width: 100, type: 'number' },
    { field: 'sellingPrice', headerName: '售價', width: 100, type: 'number' },
    {
      field: 'actions',
      headerName: '操作',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton
            color="primary"
            onClick={() => handleEditProduct(params.row.id, 'medicine')}
            size="small"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDeleteProduct(params.row.id)}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  // 獲取所有產品
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const res = await axios.get('/api/products', config);
      
      // 分離商品和藥品
      const productsList = [];
      const medicinesList = [];
      
      res.data.forEach(item => {
        const product = {
          ...item,
          id: item._id
        };
        
        if (item.productType === 'product') {
          productsList.push(product);
        } else if (item.productType === 'medicine') {
          medicinesList.push(product);
        }
      });
      
      setProducts(productsList);
      setMedicines(medicinesList);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('獲取產品失敗');
      setLoading(false);
    }
  };

  // 獲取所有供應商
  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const res = await axios.get('/api/suppliers', config);
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
      setError('獲取供應商失敗');
    }
  };

  // 獲取庫存數據
  const fetchInventory = async () => {
    try {
      setInventoryLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const res = await axios.get('/api/inventory', config);
      setInventory(res.data);
      setInventoryLoading(false);
    } catch (err) {
      console.error(err);
      setInventoryLoading(false);
    }
  };

  // 獲取特定產品的庫存
  const fetchProductInventory = async (productId) => {
    if (!productId) return;
    
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const res = await axios.get(`/api/inventory/product/${productId}`, config);
      setProductInventory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 初始化
  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    fetchInventory();
  }, []);

  // 當選中產品變化時獲取其庫存
  useEffect(() => {
    if (selectedProduct) {
      fetchProductInventory(selectedProduct.id);
    }
  }, [selectedProduct]);

  // 處理標籤切換
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 處理行點擊
  const handleRowClick = (params) => {
    const product = params.row;
    setSelectedProduct({
      ...product,
      productType: tabValue === 0 ? 'product' : 'medicine'
    });
  };

  // 打開新增產品對話框
  const handleAddProduct = () => {
    setEditMode(false);
    setProductType(tabValue === 0 ? 'product' : 'medicine');
    setCurrentProduct({
      code: '',
      shortCode: '',
      name: '',
      category: '',
      unit: '',
      purchasePrice: 0,
      sellingPrice: 0,
      description: '',
      supplier: '',
      minStock: 10,
      barcode: '',
      healthInsuranceCode: '',
      healthInsurancePrice: 0
    });
    setOpenDialog(true);
  };

  // 打開編輯產品對話框
  const handleEditProduct = (id, type) => {
    setEditMode(true);
    setProductType(type);
    
    // 根據類型獲取產品
    const product = type === 'product' 
      ? products.find(p => p.id === id)
      : medicines.find(p => p.id === id);
    
    if (product) {
      setCurrentProduct({
        id: product.id,
        code: product.code || '',
        shortCode: product.shortCode || '',
        name: product.name || '',
        category: product.category || '',
        unit: product.unit || '',
        purchasePrice: product.purchasePrice || 0,
        sellingPrice: product.sellingPrice || 0,
        description: product.description || '',
        supplier: product.supplier || '',
        minStock: product.minStock || 10,
        barcode: product.barcode || '',
        healthInsuranceCode: product.healthInsuranceCode || '',
        healthInsurancePrice: product.healthInsurancePrice || 0
      });
      setOpenDialog(true);
    }
  };

  // 處理刪除產品
  const handleDeleteProduct = async (id) => {
    if (window.confirm('確定要刪除此產品嗎？')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        
        await axios.delete(`/api/products/${id}`, config);
        
        // 更新本地狀態
        setProducts(products.filter(p => p.id !== id));
        setMedicines(medicines.filter(p => p.id !== id));
        
        // 如果刪除的是當前選中的產品，清除選中狀態
        if (selectedProduct && selectedProduct.id === id) {
          setSelectedProduct(null);
        }
      } catch (err) {
        console.error(err);
        setError('刪除產品失敗');
      }
    }
  };

  // 處理表單輸入變化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 處理保存產品
  const handleSaveProduct = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      const productData = {
        code: currentProduct.code,
        shortCode: currentProduct.shortCode,
        name: currentProduct.name,
        category: currentProduct.category,
        unit: currentProduct.unit,
        purchasePrice: currentProduct.purchasePrice,
        sellingPrice: currentProduct.sellingPrice,
        description: currentProduct.description,
        supplier: currentProduct.supplier,
        minStock: currentProduct.minStock
      };
      
      // 根據產品類型添加特有屬性
      if (productType === 'product') {
        productData.barcode = currentProduct.barcode;
        productData.productType = 'product';
      } else {
        productData.healthInsuranceCode = currentProduct.healthInsuranceCode;
        productData.healthInsurancePrice = currentProduct.healthInsurancePrice;
        productData.productType = 'medicine';
      }
      
      let response;
      if (editMode) {
        // 更新產品
        response = await axios.put(`/api/products/${currentProduct.id}`, productData, config);
        
        // 更新本地狀態
        if (productType === 'product') {
          setProducts(products.map(p => 
            p.id === currentProduct.id ? { ...response.data, id: response.data._id, productType: 'product' } : p
          ));
        } else {
          setMedicines(medicines.map(p => 
            p.id === currentProduct.id ? { ...response.data, id: response.data._id, productType: 'medicine' } : p
          ));
        }
        
        // 如果更新的是當前選中的產品，更新選中狀態
        if (selectedProduct && selectedProduct.id === currentProduct.id) {
          setSelectedProduct({
            ...response.data,
            id: response.data._id,
            productType
          });
        }
      } else {
        // 創建新產品
        const endpoint = productType === 'medicine' 
          ? '/api/products/medicine' 
          : '/api/products/product';
        response = await axios.post(endpoint, productData, config);
        
        // 更新本地狀態
        const newProduct = {
          ...response.data,
          id: response.data._id,
          productType
        };
        
        if (productType === 'product') {
          setProducts([...products, newProduct]);
        } else {
          setMedicines([...medicines, newProduct]);
        }
      }
      
      // 關閉對話框
      setOpenDialog(false);
    } catch (err) {
      console.error(err);
      setError('保存產品失敗');
    }
  };

  // 打開CSV匯入對話框
  const handleOpenCsvImport = () => {
    setCsvFile(null);
    setCsvImportError(null);
    setCsvImportSuccess(false);
    setOpenCsvDialog(true);
  };

  // 處理CSV文件選擇
  const handleCsvFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setCsvImportError(null);
    }
  };

  // 處理CSV匯入
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
      formData.append('productType', tabValue === 0 ? 'product' : 'medicine');
      
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      };
      
      const response = await axios.post('/api/products/import', formData, config);
      
      // 更新產品列表
      fetchProducts();
      
      setCsvImportSuccess(true);
      setCsvImportLoading(false);
      
      // 3秒後關閉對話框
      setTimeout(() => {
        setOpenCsvDialog(false);
        setCsvImportSuccess(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      setCsvImportError(err.response?.data?.msg || '匯入失敗，請檢查CSV格式');
      setCsvImportLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        藥品管理
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="product tabs">
              <Tab label="商品" id="product-tab-0" aria-controls="product-tabpanel-0" />
              <Tab label="藥品" id="product-tab-1" aria-controls="product-tabpanel-1" />
            </Tabs>
            <Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddProduct}
                sx={{ mr: 1 }}
              >
                {tabValue === 0 ? '新增商品' : '新增藥品'}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<CloudUploadIcon />}
                onClick={handleOpenCsvImport}
              >
                CSV匯入
              </Button>
            </Box>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <DataTable
              rows={products}
              columns={productColumns}
              loading={loading}
              onRowClick={handleRowClick}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <DataTable
              rows={medicines}
              columns={medicineColumns}
              loading={loading}
              onRowClick={handleRowClick}
            />
          </TabPanel>
        </Grid>
        
        <Grid item xs={12} md={4}>
          {selectedProduct ? (
            <Card>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {selectedProduct.name.charAt(0).toUpperCase()}
                  </Avatar>
                }
                title={selectedProduct.name}
                subheader={`編號: ${selectedProduct.code} | 簡碼: ${selectedProduct.shortCode}`}
                action={
                  <Box>
                    <IconButton
                      color="primary"
                      onClick={() => handleEditProduct(selectedProduct.id, selectedProduct.productType)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteProduct(selectedProduct.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">健保碼:</Typography>
                    <Typography variant="body2">{selectedProduct.healthInsuranceCode || '無'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">健保價:</Typography>
                    <Typography variant="body2">{selectedProduct.healthInsurancePrice || '0'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">國際條碼:</Typography>
                    <Typography variant="body2">{selectedProduct.barcode || '無'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">分類:</Typography>
                    <Typography variant="body2">{selectedProduct.category || '無'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">單位:</Typography>
                    <Typography variant="body2">{selectedProduct.unit || '無'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">進貨價:</Typography>
                    <Typography variant="body2">{selectedProduct.purchasePrice || '0'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">售價:</Typography>
                    <Typography variant="body2">{selectedProduct.sellingPrice || '0'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">最低庫存:</Typography>
                    <Typography variant="body2">{selectedProduct.minStock || '0'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">供應商:</Typography>
                    <Typography variant="body2">
                      {selectedProduct.supplier ? 
                        suppliers.find(s => s._id === selectedProduct.supplier)?.name || selectedProduct.supplier 
                        : '無'}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  庫存信息
                </Typography>
                
                <Box sx={{ 
                  p: 1, 
                  bgcolor: 'background.paper', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Typography variant="subtitle2" gutterBottom>
                    總庫存數量: 
                    <Chip 
                      label={getTotalInventory(selectedProduct.id)} 
                      color={
                        getTotalInventory(selectedProduct.id) === '0' ? 'error' : 
                        (getTotalInventory(selectedProduct.id) !== '載入中...' && 
                         parseInt(getTotalInventory(selectedProduct.id)) < selectedProduct.minStock) ? 'warning' : 'success'
                      }
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    庫存明細:
                  </Typography>
                  
                  {inventoryLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : productInventory.length > 0 ? (
                    <List dense>
                      {productInventory.map((item, index) => (
                        <ListItem key={index} divider={index < productInventory.length - 1}>
                          <Grid container spacing={1}>
                            <Grid item xs={12}>
                              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                進貨單號: 
                                <Button 
                                  variant="text" 
                                  color="primary" 
                                  size="small"
                                  onClick={() => {
                                    if (item.purchaseOrderId) {
                                      window.location.href = `/purchase-orders/${item.purchaseOrderId}`;
                                    }
                                  }}
                                  sx={{ ml: 1, minWidth: 'auto', p: '0 4px' }}
                                >
                                  {item.purchaseOrderNumber || '未指定'}
                                </Button>
                                {' | '}
                                數量: {item.quantity || 0}
                                {' | '}
                                總庫存量: {getTotalInventory(selectedProduct.id)}
                              </Typography>
                            </Grid>
                          </Grid>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" sx={{ p: 1 }}>
                      無庫存記錄
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                請選擇一個產品查看詳情
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
      
      {/* 產品表單對話框 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? (productType === 'product' ? '編輯商品' : '編輯藥品') : (productType === 'product' ? '新增商品' : '新增藥品')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="code"
                label="編號"
                value={currentProduct.code}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
                helperText="留空系統自動生成"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="shortCode"
                label="簡碼"
                value={currentProduct.shortCode}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="名稱"
                value={currentProduct.name}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
                required
              />
            </Grid>
            
            {productType === 'product' ? (
              <Grid item xs={12} sm={6}>
                <TextField
                  name="barcode"
                  label="國際條碼"
                  value={currentProduct.barcode}
                  onChange={handleInputChange}
                  fullWidth
                  margin="dense"
                />
              </Grid>
            ) : (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="healthInsuranceCode"
                    label="健保碼"
                    value={currentProduct.healthInsuranceCode}
                    onChange={handleInputChange}
                    fullWidth
                    margin="dense"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="healthInsurancePrice"
                    label="健保價"
                    type="number"
                    value={currentProduct.healthInsurancePrice}
                    onChange={handleInputChange}
                    fullWidth
                    margin="dense"
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="category"
                label="分類"
                value={currentProduct.category}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="unit"
                label="單位"
                value={currentProduct.unit}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="purchasePrice"
                label="進貨價"
                type="number"
                value={currentProduct.purchasePrice}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="sellingPrice"
                label="售價"
                type="number"
                value={currentProduct.sellingPrice}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="minStock"
                label="最低庫存"
                type="number"
                value={currentProduct.minStock}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="supplier-label">供應商</InputLabel>
                <Select
                  labelId="supplier-label"
                  name="supplier"
                  value={currentProduct.supplier}
                  onChange={handleInputChange}
                  label="供應商"
                >
                  <MenuItem value="">
                    <em>無</em>
                  </MenuItem>
                  {suppliers.map(supplier => (
                    <MenuItem key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="描述"
                value={currentProduct.description}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            取消
          </Button>
          <Button onClick={handleSaveProduct} color="primary" variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* CSV匯入對話框 */}
      <Dialog open={openCsvDialog} onClose={() => !csvImportLoading && setOpenCsvDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          CSV匯入{tabValue === 0 ? '商品' : '藥品'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {csvImportSuccess ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                匯入成功！
              </Alert>
            ) : csvImportError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {csvImportError}
              </Alert>
            ) : null}
            
            <Typography variant="body2" gutterBottom>
              請選擇CSV文件進行匯入。CSV文件應包含以下欄位：
            </Typography>
            
            <Typography variant="body2" component="div" sx={{ mb: 2 }}>
              {tabValue === 0 ? (
                <ul>
                  <li>code (選填) - 商品編號，留空系統自動生成</li>
                  <li>shortCode (必填) - 簡碼</li>
                  <li>name (必填) - 商品名稱</li>
                  <li>barcode (選填) - 國際條碼</li>
                  <li>category (選填) - 分類</li>
                  <li>unit (選填) - 單位</li>
                  <li>purchasePrice (選填) - 進貨價</li>
                  <li>sellingPrice (選填) - 售價</li>
                  <li>minStock (選填) - 最低庫存</li>
                  <li>description (選填) - 描述</li>
                </ul>
              ) : (
                <ul>
                  <li>code (選填) - 藥品編號，留空系統自動生成</li>
                  <li>shortCode (必填) - 簡碼</li>
                  <li>name (必填) - 藥品名稱</li>
                  <li>healthInsuranceCode (選填) - 健保碼</li>
                  <li>healthInsurancePrice (選填) - 健保價</li>
                  <li>category (選填) - 分類</li>
                  <li>unit (選填) - 單位</li>
                  <li>purchasePrice (選填) - 進貨價</li>
                  <li>sellingPrice (選填) - 售價</li>
                  <li>minStock (選填) - 最低庫存</li>
                  <li>description (選填) - 描述</li>
                </ul>
              )}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
              <Button
                variant="outlined"
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
              
              {csvImportLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    正在匯入...
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenCsvDialog(false)} 
            color="inherit"
            disabled={csvImportLoading}
          >
            取消
          </Button>
          <Button 
            onClick={handleCsvImport} 
            color="primary" 
            variant="contained"
            disabled={!csvFile || csvImportLoading}
          >
            匯入
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsPage;
