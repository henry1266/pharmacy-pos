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
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
        // 添加id屬性以便於表格使用
        const product = { ...item, id: item._id };
        
        if (item.healthInsuranceCode) {
          product.productType = 'medicine';
          medicinesList.push(product);
        } else {
          product.productType = 'product';
          productsList.push(product);
        }
      });
      
      setProducts(productsList);
      setMedicines(medicinesList);
      setLoading(false);
    } catch (err) {
      console.error('獲取產品失敗:', err);
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
      console.error('獲取供應商失敗:', err);
    }
  };

  // 獲取所有庫存
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
      console.error('獲取庫存失敗:', err);
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
      console.error('獲取產品庫存失敗:', err);
    }
  };

  // 初始化
  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    fetchInventory();
  }, []);

  // 處理標籤切換
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setProductType(newValue === 0 ? 'product' : 'medicine');
  };

  // 處理表格行點擊
  const handleRowClick = (params) => {
    const product = params.row;
    setSelectedProduct(product);
    fetchProductInventory(product.id);
  };

  // 打開添加產品對話框
  const handleAddProduct = () => {
    setEditMode(false);
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
          setProductInventory([]);
        }
      } catch (err) {
        console.error('刪除產品失敗:', err);
        setError('刪除產品失敗');
      }
    }
  };

  // 處理關閉對話框
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // 處理輸入變化
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
          setSelectedProduct({ ...response.data, id: response.data._id, productType });
          // 重新獲取該產品的庫存信息
          fetchProductInventory(response.data._id);
        }
      } else {
        // 創建產品 - 根據產品類型選擇正確的API端點
        const endpoint = productType === 'medicine' 
          ? '/api/products/medicine' 
          : '/api/products/product';
        
        response = await axios.post(endpoint, productData, config);
        
        // 更新本地狀態
        const newProduct = { ...response.data, id: response.data._id, productType };
        if (productType === 'product') {
          setProducts([...products, newProduct]);
        } else {
          setMedicines([...medicines, newProduct]);
        }
      }
      
      // 關閉對話框
      setOpenDialog(false);
    } catch (err) {
      console.error('保存產品失敗:', err);
      setError('保存產品失敗');
    }
  };

  // 獲取供應商名稱
  const getSupplierName = (supplierId) => {
    if (!supplierId) return '無';
    const supplier = suppliers.find(s => s._id === supplierId);
    return supplier ? supplier.name : '未知供應商';
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        藥品管理
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="product type tabs">
          <Tab label="商品" id="product-tab-0" aria-controls="product-tabpanel-0" />
          <Tab label="藥品" id="product-tab-1" aria-controls="product-tabpanel-1" />
        </Tabs>
      </Box>
      
      <Grid container spacing={3}>
        {/* 左側 - 產品列表 */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddProduct}
            >
              {tabValue === 0 ? '新增商品' : '新增藥品'}
            </Button>
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
        
        {/* 右側 - 產品詳情 */}
        <Grid item xs={12} md={4}>
          {selectedProduct ? (
            <Card>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {selectedProduct.name.charAt(0)}
                  </Avatar>
                }
                title={selectedProduct.name}
                subheader={`${selectedProduct.code} | ${selectedProduct.shortCode || '無簡碼'}`}
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
                    <Typography variant="body2">{selectedProduct.minStock || '10'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">供應商:</Typography>
                    <Typography variant="body2">{getSupplierName(selectedProduct.supplier)}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">描述:</Typography>
                    <Typography variant="body2">{selectedProduct.description || '無'}</Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                {/* 庫存信息 */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    庫存信息
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
                  
                  {productInventory.length > 0 ? (
                    <List>
                      {productInventory.map((item, index) => (
                        <ListItem key={index} divider>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2">批號:</Typography>
                              <Typography variant="body2">{item.batchNumber || '未指定'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2">數量:</Typography>
                              <Typography variant="body2">{item.quantity}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2">有效期限:</Typography>
                              <Typography variant="body2">
                                {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '未指定'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2">存放位置:</Typography>
                              <Typography variant="body2">{item.location || '未指定'}</Typography>
                            </Grid>
                          </Grid>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      無庫存記錄
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                請選擇一個產品查看詳情
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
      
      {/* 添加/編輯產品對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
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
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="shortCode"
                label="簡碼"
                value={currentProduct.shortCode}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="名稱"
                value={currentProduct.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="category"
                label="分類"
                value={currentProduct.category}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="unit"
                label="單位"
                value={currentProduct.unit}
                onChange={handleInputChange}
                fullWidth
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
                required
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
                required
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>供應商</InputLabel>
                <Select
                  name="supplier"
                  value={currentProduct.supplier}
                  onChange={handleInputChange}
                  label="供應商"
                >
                  <MenuItem value="">無</MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* 商品特有欄位 */}
            {productType === 'product' && (
              <Grid item xs={12}>
                <TextField
                  name="barcode"
                  label="國際條碼"
                  value={currentProduct.barcode}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
            )}
            
            {/* 藥品特有欄位 */}
            {productType === 'medicine' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="healthInsuranceCode"
                    label="健保碼"
                    value={currentProduct.healthInsuranceCode}
                    onChange={handleInputChange}
                    fullWidth
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
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="描述"
                value={currentProduct.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            取消
          </Button>
          <Button onClick={handleSaveProduct} color="primary" variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsPage;
