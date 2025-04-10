import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';

// 導入拆分後的組件
import BasicInfoForm from '../components/purchase-order-form/BasicInfoForm';
import ProductItemForm from '../components/purchase-order-form/ProductItemForm';
import ProductItemsTable from '../components/purchase-order-form/ProductItemsTable';
import ActionButtons from '../components/purchase-order-form/ActionButtons';

const PurchaseOrderEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // 狀態管理
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    poid: '',
    pobill: '',
    pobilldate: new Date(),
    posupplier: '',
    supplier: '',
    items: [],
    notes: '',
    status: 'pending',
    paymentStatus: '未付'
  });
  
  const [currentItem, setCurrentItem] = useState({
    did: '',
    dname: '',
    dquantity: '',
    dtotalCost: '',
    product: null
  });
  
  // 編輯項目狀態
  const [editingItemIndex, setEditingItemIndex] = useState(-1);
  const [editingItem, setEditingItem] = useState(null);
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // 保存當前選中的供應商對象
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  
  // 標記數據加載狀態
  const [orderDataLoaded, setOrderDataLoaded] = useState(false);
  const [suppliersLoaded, setSuppliersLoaded] = useState(false);
  
  // 初始化加載數據
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await fetchPurchaseOrderData();
        await fetchProducts();
        await fetchSuppliers();
        setLoading(false);
      } catch (err) {
        setLoading(false);
        console.error('加載數據失敗:', err);
      }
    };
    
    loadData();
  }, [id]);

  // 獲取進貨單數據
  const fetchPurchaseOrderData = async () => {
    try {
      const response = await axios.get(`/api/purchase-orders/${id}`);
      const orderData = response.data;
      console.log('獲取到進貨單數據:', orderData);
      
      setFormData({
        ...orderData,
        pobilldate: orderData.pobilldate ? new Date(orderData.pobilldate) : new Date()
      });
      
      setOrderDataLoaded(true);
      return orderData;
    } catch (err) {
      console.error('獲取進貨單數據失敗:', err);
      setError('獲取進貨單數據失敗');
      setSnackbar({
        open: true,
        message: '獲取進貨單數據失敗: ' + (err.response?.data?.msg || err.message),
        severity: 'error'
      });
      throw err;
    }
  };

  // 獲取產品數據
  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
      return response.data;
    } catch (err) {
      console.error('獲取產品數據失敗:', err);
      setSnackbar({
        open: true,
        message: '獲取產品數據失敗',
        severity: 'error'
      });
      throw err;
    }
  };

  // 獲取供應商數據
  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers');
      const suppliersData = response.data;
      console.log('獲取到供應商數據:', suppliersData);
      setSuppliers(suppliersData);
      setSuppliersLoaded(true);
      return suppliersData;
    } catch (err) {
      console.error('獲取供應商數據失敗:', err);
      setSnackbar({
        open: true,
        message: '獲取供應商數據失敗',
        severity: 'error'
      });
      throw err;
    }
  };
  
  // 當進貨單數據和供應商數據都加載完成後，設置選中的供應商
  useEffect(() => {
    if (orderDataLoaded && suppliersLoaded) {
      console.log('進貨單數據和供應商數據都已加載完成');
      
      if (formData.supplier) {
        console.log('當前供應商數據:', formData.supplier);
        
        // 處理不同格式的supplier字段
        let supplierId;
        if (typeof formData.supplier === 'string') {
          supplierId = formData.supplier;
        } else if (typeof formData.supplier === 'object') {
          // 處理MongoDB返回的對象格式
          if (formData.supplier._id) {
            supplierId = formData.supplier._id;
          } else if (formData.supplier.$oid) {
            supplierId = formData.supplier.$oid;
          }
        }
        
        console.log('尋找供應商ID:', supplierId);
        
        if (supplierId) {
          const supplier = suppliers.find(s => s._id === supplierId);
          if (supplier) {
            console.log('找到匹配的供應商:', supplier);
            setSelectedSupplier(supplier);
          } else {
            console.log('未找到匹配的供應商');
          }
        }
      }
    }
  }, [orderDataLoaded, suppliersLoaded, formData.supplier, suppliers]);

  // 處理輸入變化
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      pobilldate: date
    });
  };
  
  const handleSupplierChange = (event, newValue) => {
    if (newValue) {
      setSelectedSupplier(newValue);
      setFormData({
        ...formData,
        posupplier: newValue.name,
        supplier: newValue._id
      });
    } else {
      setSelectedSupplier(null);
      setFormData({
        ...formData,
        posupplier: '',
        supplier: ''
      });
    }
  };
  
  const handleItemInputChange = (e) => {
    setCurrentItem({
      ...currentItem,
      [e.target.name]: e.target.value
    });
  };
  
  // 處理編輯項目輸入變更
  const handleEditingItemChange = (e) => {
    setEditingItem({
      ...editingItem,
      [e.target.name]: e.target.value
    });
  };
  
  const handleProductChange = (event, newValue) => {
    if (newValue) {
      setCurrentItem({
        ...currentItem,
        did: newValue.code,
        dname: newValue.name,
        product: newValue._id
      });
    } else {
      setCurrentItem({
        ...currentItem,
        did: '',
        dname: '',
        product: null
      });
    }
  };
  
  const handleAddItem = () => {
    // 驗證項目
    if (!currentItem.did || !currentItem.dname || !currentItem.dquantity || currentItem.dtotalCost === '') {
      setSnackbar({
        open: true,
        message: '請填寫完整的藥品項目資料',
        severity: 'error'
      });
      return;
    }
    
    // 添加項目
    setFormData({
      ...formData,
      items: [...formData.items, { ...currentItem }]
    });
    
    // 清空當前項目
    setCurrentItem({
      did: '',
      dname: '',
      dquantity: '',
      dtotalCost: '',
      product: null
    });
    
    // 聚焦回藥品選擇欄位，方便繼續添加
    setTimeout(() => {
      const productInput = document.getElementById('product-select-input');
      if (productInput) {
        productInput.focus();
      }
    }, 100);
  };
  
  const handleRemoveItem = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({
      ...formData,
      items: newItems
    });
  };
  
  // 開始編輯項目
  const handleEditItem = (index) => {
    setEditingItemIndex(index);
    setEditingItem({...formData.items[index]});
  };
  
  // 保存編輯項目
  const handleSaveEditItem = () => {
    // 驗證編輯項目
    if (!editingItem.did || !editingItem.dname || !editingItem.dquantity || editingItem.dtotalCost === '') {
      setSnackbar({
        open: true,
        message: '請填寫完整的藥品項目資料',
        severity: 'error'
      });
      return;
    }
    
    // 更新項目
    const newItems = [...formData.items];
    newItems[editingItemIndex] = editingItem;
    setFormData({
      ...formData,
      items: newItems
    });
    
    // 退出編輯模式
    setEditingItemIndex(-1);
    setEditingItem(null);
  };
  
  // 取消編輯項目
  const handleCancelEditItem = () => {
    setEditingItemIndex(-1);
    setEditingItem(null);
  };
  
  // 移動項目順序
  const handleMoveItem = (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === formData.items.length - 1)
    ) {
      return; // 如果是第一項要上移或最後一項要下移，則不執行
    }
    
    const newItems = [...formData.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // 交換項目位置
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    setFormData({
      ...formData,
      items: newItems
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 驗證表單
    if (!formData.poid || !formData.posupplier) {
      setSnackbar({
        open: true,
        message: '請填寫所有必填欄位',
        severity: 'error'
      });
      return;
    }
    
    if (formData.items.length === 0) {
      setSnackbar({
        open: true,
        message: '請至少添加一個藥品項目',
        severity: 'error'
      });
      return;
    }
    
    try {
      // 準備銷售數據
      const submitData = {
        ...formData,
        pobilldate: format(formData.pobilldate, 'yyyy-MM-dd')
      };
      
      // 更新進貨單
      await axios.put(`/api/purchase-orders/${id}`, submitData);
      
      setSnackbar({
        open: true,
        message: '進貨單已更新',
        severity: 'success'
      });
      
      // 導航回進貨單列表
      setTimeout(() => {
        navigate('/purchase-orders');
      }, 1500);
      
    } catch (err) {
      console.error('更新進貨單失敗:', err);
      setSnackbar({
        open: true,
        message: '更新進貨單失敗: ' + (err.response?.data?.msg || err.message),
        severity: 'error'
      });
    }
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  const handleCancel = () => {
    navigate('/purchase-orders');
  };
  
  // 計算總金額
  const totalAmount = formData.items.reduce((sum, item) => sum + Number(item.dtotalCost), 0);
  
  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>載入中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/purchase-orders')}
          sx={{ mt: 2 }}
        >
          返回進貨單列表
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          編輯進貨單
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/purchase-orders')}
        >
          返回進貨單列表
        </Button>
      </Box>
      
      <form onSubmit={handleSubmit}>
        {/* 基本資訊表單 */}
        <BasicInfoForm 
          formData={formData}
          handleInputChange={handleInputChange}
          handleDateChange={handleDateChange}
          handleSupplierChange={handleSupplierChange}
          suppliers={suppliers}
          selectedSupplier={selectedSupplier}
          isEditMode={true}
        />
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              藥品項目
            </Typography>
            
            {/* 操作按鈕 */}
            <ActionButtons 
              loading={loading}
              onSave={handleSubmit}
              onCancel={handleCancel}
            />
            
            {/* 藥品項目輸入表單 */}
            <ProductItemForm 
              currentItem={currentItem}
              handleItemInputChange={handleItemInputChange}
              handleProductChange={handleProductChange}
              handleAddItem={handleAddItem}
              products={products}
            />
            
            {/* 藥品項目表格 */}
            <ProductItemsTable 
              items={formData.items}
              editingItemIndex={editingItemIndex}
              editingItem={editingItem}
              handleEditItem={handleEditItem}
              handleSaveEditItem={handleSaveEditItem}
              handleCancelEditItem={handleCancelEditItem}
              handleRemoveItem={handleRemoveItem}
              handleMoveItem={handleMoveItem}
              handleEditingItemChange={handleEditingItemChange}
              totalAmount={totalAmount}
            />
          </CardContent>
        </Card>
      </form>
      
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

export default PurchaseOrderEditPage;
