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

  // 處理標籤切換
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setProductType(newValue === 0 ? 'product' : 'medicine');
    setSelectedProduct(null);
    setProductInventory([]);
  };

  // 獲取所有產品數據
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      // 獲取商品
      const productsResponse = await axios.get('/api/products/products', config);
      
      // 格式化商品數據
      const formattedProducts = productsResponse.data.map(product => ({
        id: product._id,
        code: product.code,
        shortCode: product.shortCode || '',
        name: product.name,
        barcode: product.barcode || '',
        category: product.category || '',
        unit: product.unit || '',
        purchasePrice: product.purchasePrice || 0,
        sellingPrice: product.sellingPrice || 0,
        description: product.description || '',
        supplier: product.supplier || '',
        minStock: product.minStock,
        productType: 'product'
      }));
      
      setProducts(formattedProducts);
      
      // 獲取藥品
      const medicinesResponse = await axios.get('/api/products/medicines', config);
      
      // 格式化藥品數據
      const formattedMedicines = medicinesResponse.data.map(medicine => ({
        id: medicine._id,
        code: medicine.code,
        shortCode: medicine.shortCode || '',
        name: medicine.name,
        healthInsuranceCode: medicine.healthInsuranceCode || '',
        healthInsurancePrice: medicine.healthInsurancePrice || 0,
        category: medicine.category || '',
        unit: medicine.unit || '',
        purchasePrice: medicine.purchasePrice || 0,
        sellingPrice: medicine.sellingPrice || 0,
        description: medicine.description || '',
        supplier: medicine.supplier || '',
        minStock: medicine.minStock,
        productType: 'medicine'
      }));
      
      setMedicines(formattedMedicines);
      setLoading(false);
    } catch (err) {
      console.error('獲取產品數據失敗:', err);
      setError('獲取產品數據失敗');
      setLoading(false);
    }
  };

  // 獲取供應商數據
  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const response = await axios.get('/api/suppliers', config);
      setSuppliers(response.data);
    } catch (err) {
      console.error('獲取供應商數據失敗:', err);
    }
  };

  // 獲取庫存數據
  const fetchInventory = async () => {
    try {
      setInventoryLoading(true);
      const response = await axios.get('/api/inventory');
      console.log('庫存數據:', response.data);
      // 轉換數據格式
      const formattedInventory = response.data.map(item => ({
        id: item._id,
        ...item
      }));
      setInventory(formattedInventory);
    } catch (err) {
      console.error('獲取庫存數據失敗:', err);
    } finally {
      setInventoryLoading(false);
    }
  };

  // 獲取特定產品的庫存
  const fetchProductInventory = async (productId) => {
    if (!productId) {
      setProductInventory([]);
      return;
    }
    
    try {
      setInventoryLoading(true);
      const response = await axios.get(`/api/inventory/product/${productId}`);
      console.log('產品庫存數據:', response.data);
      setProductInventory(response.data);
    } catch (err) {
      console.error('獲取產品庫存數據失敗:', err);
      setProductInventory([]);
    } finally {
      setInventoryLoading(false);
    }
  };

  // 初始化加載數據
  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    fetchInventory();
  }, []);

  // 處理輸入變更
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // 確保空值能夠正確清空欄位，數字欄位特殊處理
    const numericFields = ['purchasePrice', 'sellingPrice', 'minStock', 'healthInsurancePrice'];
    const processedValue = value === '' && !numericFields.includes(name) ? '' : 
                          numericFields.includes(name) ? (value === '' ? 0 : Number(value)) : value;
    
    setCurrentProduct({
      ...currentProduct,
      [name]: processedValue
    });
  };

  // 處理選擇產品
  const handleSelectProduct = (id, type) => {
    const productList = type === 'product' ? products : medicines;
    const product = productList.find(p => p.id === id);
    
    if (product) {
      setSelectedProduct(product);
      // 獲取該產品的庫存信息
      fetchProductInventory(product.id);
    }
  };

  // 處理編輯產品
  const handleEditProduct = (id, type) => {
    // 如果已經選中了該產品，更新選中狀態
    if (selectedProduct && selectedProduct.id === id) {
      setSelectedProduct(null);
      setProductInventory([]);
    }
    
    const productList = type === 'product' ? products : medicines;
    const product = productList.find(p => p.id === id);
    
    if (!product) {
      console.error('找不到ID為', id, '的產品');
      return;
    }
    
    setCurrentProduct({
      id: product.id,
      code: product.code,
      shortCode: product.shortCode,
      name: product.name,
      category: product.category,
      unit: product.unit,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      description: product.description,
      supplier: product.supplier,
      minStock: product.minStock,
      barcode: product.barcode || '',
      healthInsuranceCode: product.healthInsuranceCode || '',
      healthInsurancePrice: product.healthInsurancePrice || 0
    });
    
    setEditMode(true);
    setProductType(type);
    setTabValue(type === 'product' ? 0 : 1);
    setOpenDialog(true);
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
        if (productType === 'product') {
          setProducts(products.filter(p => p.id !== id));
        } else {
          setMedicines(medicines.filter(p => p.id !== id));
        }
        
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

  // 處理添加產品
  const handleAddProduct = () => {
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
    setEditMode(false);
    setOpenDialog(true);
  };

  // 處理關閉對話框
  const handleCloseDialog = () => {
    setOpenDialog(false);
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
        // 創建產品
        response = await axios.post('/api/products', productData, config);
        
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
              添加{productType === 'product' ? '商品' : '藥品'}
            </Button>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <Paper elevation={2} sx={{ p: 0 }}>
              <DataTable
                rows={products}
                columns={productColumns}
                pageSize={10}
                loading={loading}
                onRowClick={(params) => handleSelectProduct(params.id, 'product')}
              />
            </Paper>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Paper elevation={2} sx={{ p: 0 }}>
              <DataTable
                rows={medicines}
                columns={medicineColumns}
                pageSize={10}
                loading={loading}
                onRowClick={(params) => handleSelectProduct(params.id, 'medicine')}
              />
            </Paper>
          </TabPanel>
        </Grid>
        
        {/* 右側 - 產品詳情 */}
        <Grid item xs={12} md={4}>
          <TabPanel value={tabValue} index={0}>
            {selectedProduct && selectedProduct.productType === 'product' ? (
              <Card elevation={2}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {selectedProduct.shortCode?.charAt(0) || selectedProduct.name?.charAt(0) || 'P'}
                    </Avatar>
                  }
                  title={
                    <Typography variant="h6" component="div">
                      {selectedProduct.name}
                    </Typography>
                  }
                  subheader={`編號: ${selectedProduct.code} | 簡碼: ${selectedProduct.shortCode}`}
                  action={
                    <Box>
                      <IconButton
                        color="primary"
                        onClick={() => handleEditProduct(selectedProduct.id, 'product')}
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
                <Divider />
                <CardContent sx={{ py: 1 }}>
                  <List dense sx={{ py: 0 }}>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>國際條碼:</Typography>
                      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.barcode || '無'}</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>分類:</Typography>
                      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.category || '無'}</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>單位:</Typography>
                      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.unit || '無'}</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>進貨價:</Typography>
                      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.purchasePrice}</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>售價:</Typography>
                      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.sellingPrice}</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>最低庫存:</Typography>
                      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.minStock}</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>供應商:</Typography>
                      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{getSupplierName(selectedProduct.supplier)}</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>描述:</Typography>
                      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.description || '無'}</Typography>
                    </ListItem>
                    
                    {/* 庫存信息 */}
                    <Divider sx={{ my: 1 }} />
                    <ListItem>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>庫存信息</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>總庫存數量:</Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          width: '60%', 
                          fontWeight: 500,
                          color: inventoryLoading ? 'text.secondary' : 
                                 (getTotalInventory(selectedProduct.id) === '0' ? 'error.main' : 
                                 (parseInt(getTotalInventory(selectedProduct.id)) < selectedProduct.minStock ? 'warning.main' : 'success.main'))
                        }}
                      >
                        {inventoryLoading ? '載入中...' : getTotalInventory(selectedProduct.id)}
                      </Typography>
                    </ListItem>
                    
                    {/* 庫存明細 */}
                    {productInventory.length > 0 && (
                      <>
                        <ListItem>
                          <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>庫存明細</Typography>
                        </ListItem>
                        {productInventory.map((item, index) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <Box sx={{ width: '100%' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>批號: {item.batchNumber || '無'}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>數量: {item.quantity}</Typography>
                              </Box>
                              {item.expiryDate && (
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                  有效期限: {new Date(item.expiryDate).toLocaleDateString()}
                                </Typography>
                              )}
                              {item.location && (
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                  存放位置: {item.location}
                                </Typography>
                              )}
                              <Divider sx={{ my: 0.5 }} />
                            </Box>
                          </ListItem>
                        ))}
                      </>
                    )}
                  </List>
                </CardContent>
              </Card>
            ) : (
              <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  請選擇一個商品查看詳情
                </Typography>
              </Paper>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {selectedProduct && selectedProduct.productType === 'medicine' ? (
              <Card elevation={2}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      {selectedProduct.shortCode?.charAt(0) || selectedProduct.name?.charAt(0) || 'M'}
                    </Avatar>
                  }
                  title={
                    <Typography variant="h6" component="div">
                      {selectedProduct.name}
                    </Typography>
                  }
                  subheader={`編號: ${selectedProduct.code} | 簡碼: ${selectedProduct.shortCode}`}
                  action={
                    <Box>
                      <IconButton
                        color="primary"
                        onClick={() => handleEditProduct(selectedProduct.id, 'medicine')}
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
                <Divider />
                <CardContent sx={{ py: 1 }}>
                  <List dense sx={{ py: 0 }}>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>健保碼:</Typography>
                      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.healthInsuranceCode || '無'}</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>健保價:</Typography>
                      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.healthInsurancePrice}</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>分類:</Typography>
                      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.category || '無'}</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>單位:</Typography>
                      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.unit || '無'}</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>進貨價:</Typography>
                      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.purchasePrice}</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>售價:</Typography>
                      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.sellingPrice}</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>最低庫存:</Typography>
                      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.minStock}</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>供應商:</Typography>
                      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{getSupplierName(selectedProduct.supplier)}</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>描述:</Typography>
                      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.description || '無'}</Typography>
                    </ListItem>
                    
                    {/* 庫存信息 */}
                    <Divider sx={{ my: 1 }} />
                    <ListItem>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>庫存信息</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>總庫存數量:</Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          width: '60%', 
                          fontWeight: 500,
                          color: inventoryLoading ? 'text.secondary' : 
                                 (getTotalInventory(selectedProduct.id) === '0' ? 'error.main' : 
                                 (parseInt(getTotalInventory(selectedProduct.id)) < selectedProduct.minStock ? 'warning.main' : 'success.main'))
                        }}
                      >
                        {inventoryLoading ? '載入中...' : getTotalInventory(selectedProduct.id)}
                      </Typography>
                    </ListItem>
                    
                    {/* 庫存明細 */}
                    {productInventory.length > 0 && (
                      <>
                        <ListItem>
                          <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>庫存明細</Typography>
                        </ListItem>
                        {productInventory.map((item, index) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <Box sx={{ width: '100%' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>批號: {item.batchNumber || '無'}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>數量: {item.quantity}</Typography>
                              </Box>
                              {item.expiryDate && (
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                  有效期限: {new Date(item.expiryDate).toLocaleDateString()}
                                </Typography>
                              )}
                              {item.location && (
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                  存放位置: {item.location}
                                </Typography>
                              )}
                              <Divider sx={{ my: 0.5 }} />
                            </Box>
                          </ListItem>
                        ))}
                      </>
                    )}
                  </List>
                </CardContent>
              </Card>
            ) : (
              <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  請選擇一個藥品查看詳情
                </Typography>
              </Paper>
            )}
          </TabPanel>
        </Grid>
      </Grid>
      
      {/* 產品表單對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? '編輯' : '添加'}{productType === 'product' ? '商品' : '藥品'}</DialogTitle>
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
