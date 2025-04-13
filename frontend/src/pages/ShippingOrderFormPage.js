import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Snackbar,
  Alert,
  Button
} from '@mui/material';
import { format } from 'date-fns';

import { 
  fetchShippingOrder, 
  addShippingOrder, 
  updateShippingOrder 
} from '../redux/actions';
import { fetchCustomers } from '../redux/actions';
import { fetchProducts } from '../redux/actions';
import { fetchInventory } from '../redux/actions';

// 導入拆分後的組件
import BasicInfoForm from '../components/shipping-orders/form/BasicInfo';
import ProductItemForm from '../components/shipping-orders/form/ProductItems/ItemForm';
import ItemsTable from '../components/shipping-orders/form/ProductItems/ItemsTable';
import ConfirmDialog from '../components/shipping-orders/common/ConfirmDialog';

const ShippingOrderFormPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const { currentShippingOrder, loading, error } = useSelector(state => state.shippingOrders);
  const { customers } = useSelector(state => state.customers);
  const { products } = useSelector(state => state.products);
  const { inventory } = useSelector(state => state.inventory || { inventory: {} });
  
  // 將庫存數據轉換為以產品ID為鍵的對象，方便查詢
  const [inventoryData, setInventoryData] = useState({});
  
  useEffect(() => {
    if (inventory && Array.isArray(inventory)) {
      const inventoryMap = {};
      inventory.forEach(item => {
        if (item.product) {
          // 如果產品ID已存在，累加數量
          if (inventoryMap[item.product]) {
            inventoryMap[item.product].quantity += item.quantity;
          } else {
            inventoryMap[item.product] = {
              quantity: item.quantity
            };
          }
        }
      });
      setInventoryData(inventoryMap);
    }
  }, [inventory]);
  
  const [formData, setFormData] = useState({
    soid: '',
    sobill: '',
    sobilldate: new Date(),
    socustomer: '',
    customer: '',
    items: [],
    notes: '',
    status: 'pending',
    paymentStatus: '未收'
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
  
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // 保存當前選中的客戶對象
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchProducts());
    dispatch(fetchInventory());
    
    if (isEditMode && id) {
      dispatch(fetchShippingOrder(id));
    } else {
      // 在新增模式下，設置焦點到發票號碼欄位
      setTimeout(() => {
        const invoiceInput = document.querySelector('input[name="sobill"]');
        if (invoiceInput) {
          invoiceInput.focus();
        }
      }, 800); // 延長時間確保DOM已完全載入
    }
  }, [dispatch, isEditMode, id]);
  
  // 確保customers數據已加載
  const [customersLoaded, setCustomersLoaded] = useState(false);
  
  useEffect(() => {
    if (customers && customers.length > 0) {
      setCustomersLoaded(true);
    }
  }, [customers]);
  
  // 在編輯模式下載入出貨單數據
  useEffect(() => {
    if (isEditMode && currentShippingOrder && customersLoaded) {
      console.log('設置編輯模式數據', currentShippingOrder);
      
      // 確保保留客戶信息
      const customerData = {
        socustomer: currentShippingOrder.socustomer || '',
        customer: currentShippingOrder.customer || ''
      };
      
      setFormData({
        ...currentShippingOrder,
        ...customerData, // 確保客戶信息被保留
        sobilldate: currentShippingOrder.sobilldate ? new Date(currentShippingOrder.sobilldate) : new Date()
      });
      
      // 找到並設置當前選中的客戶
      if (currentShippingOrder.customer) {
        const customer = customers.find(c => 
          c._id === currentShippingOrder.customer || 
          c._id === currentShippingOrder.customer._id
        );
        if (customer) {
          setSelectedCustomer(customer);
        }
      }
      
      // 在編輯模式下，載入數據後將焦點直接放在商品選擇欄位上
      setTimeout(() => {
        // 直接使用ID選擇器定位藥品選擇欄位
        const productInput = document.getElementById('product-select-input');
        if (productInput) {
          productInput.focus();
        }
      }, 800); // 延長時間確保DOM已完全載入
    }
  }, [isEditMode, currentShippingOrder, customersLoaded, customers]);
  
  useEffect(() => {
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: 'error'
      });
    }
  }, [error]);
  
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      sobilldate: date
    });
  };
  
  const handleCustomerChange = (event, newValue) => {
    if (newValue) {
      setSelectedCustomer(newValue);
      setFormData({
        ...formData,
        socustomer: newValue.name,
        customer: newValue._id
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        ...formData,
        socustomer: '',
        customer: ''
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
  
  // 檢查庫存是否足夠
  const isInventorySufficient = (item) => {
    if (!item.product || !item.dquantity) return true;
    
    const productInventory = inventoryData[item.product];
    const availableQuantity = productInventory ? productInventory.quantity : 0;
    
    return availableQuantity >= parseInt(item.dquantity);
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
    
    // 檢查庫存是否足夠
    if (!isInventorySufficient(currentItem)) {
      setSnackbar({
        open: true,
        message: '庫存不足，無法添加此項目',
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
    
    // 檢查庫存是否足夠
    if (!isInventorySufficient(editingItem)) {
      setSnackbar({
        open: true,
        message: '庫存不足，無法保存此項目',
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
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 驗證表單
    if (!formData.socustomer) {
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
    
    // 檢查所有項目的庫存是否足夠
    const insufficientItems = formData.items.filter(item => !isInventorySufficient(item));
    if (insufficientItems.length > 0) {
      setSnackbar({
        open: true,
        message: '部分藥品庫存不足，無法提交',
        severity: 'error'
      });
      return;
    }
    
    // 如果狀態為已完成，顯示確認對話框
    if (formData.status === 'completed') {
      setConfirmDialogOpen(true);
      return;
    }
    
    // 提交表單
    submitForm();
  };
  
  const submitForm = () => {
    const submitData = {
      ...formData,
      sobilldate: format(formData.sobilldate, 'yyyy-MM-dd')
    };
    
    if (isEditMode) {
      dispatch(updateShippingOrder(id, submitData, navigate));
    } else {
      dispatch(addShippingOrder(submitData, navigate));
    }
  };
  
  const handleConfirmComplete = () => {
    setConfirmDialogOpen(false);
    submitForm();
  };
  
  const handleCancelComplete = () => {
    setConfirmDialogOpen(false);
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  const handleCancel = () => {
    navigate('/shipping-orders');
  };
  
  // 計算總金額
  const totalAmount = formData.items.reduce((sum, item) => sum + Number(item.dtotalCost), 0);
  
  return (
    <Box>
      <Typography variant="h5" component="h1" gutterBottom>
        {isEditMode ? '編輯出貨單' : '新增出貨單'}
      </Typography>
      
      <form onSubmit={handleSubmit}>
        {/* 基本資訊表單 */}
        <BasicInfoForm 
          formData={formData}
          handleInputChange={handleInputChange}
          handleDateChange={handleDateChange}
          handleCustomerChange={handleCustomerChange}
          customers={customers}
          selectedCustomer={selectedCustomer}
          isEditMode={isEditMode}
        />
        
        <Card sx={{ mb: 1 }}>
          <CardContent sx={{ pb: 1 }}>
            <Typography variant="h6">
              藥品項目
            </Typography>
            
            {/* 操作按鈕 */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                color="primary" 
                type="submit"
                disabled={loading}
                sx={{ mr: 1 }}
              >
                {isEditMode ? '保存' : '創建'}
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleCancel}
                disabled={loading}
              >
                取消
              </Button>
            </Box>
            
            {/* 固定的輸入區域 */}
            <Box 
              sx={{ 
                position: 'sticky', 
                top: 0, 
                backgroundColor: 'white', 
                zIndex: 10,
                pb: 1,
                borderBottom: '1px solid #e0e0e0'
              }}
            >
              <ProductItemForm 
                currentItem={currentItem}
                handleItemInputChange={handleItemInputChange}
                handleProductChange={handleProductChange}
                handleAddItem={handleAddItem}
                products={products}
                inventoryData={inventoryData}
              />
            </Box>
            
            {/* 藥品項目表格 - 設置固定高度使總計欄可見 */}
            <Box sx={{ height: 'calc(100vh - 550px)', minHeight: '250px' }}>
              <ItemsTable 
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
                inventoryData={inventoryData}
              />
            </Box>
          </CardContent>
        </Card>
        
        {/* 確認對話框 */}
        <ConfirmDialog 
          open={confirmDialogOpen}
          onClose={handleCancelComplete}
          onConfirm={handleConfirmComplete}
          shippingOrder={formData}
        />
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

export default ShippingOrderFormPage;
