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


import { 
  fetchShippingOrder, 
  addShippingOrder, 
  updateShippingOrder 
} from '../redux/actions';
import { fetchSuppliers } from '../redux/actions';
import { fetchProducts } from '../redux/actions';


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
  const { suppliers } = useSelector(state => state.suppliers);
  const { products } = useSelector(state => state.products);
  

  
  const [formData, setFormData] = useState({
    soid: '',
    sosupplier: '',
    supplier: '',
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
  
  // 保存當前選中的供應商對象
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  
  useEffect(() => {
    dispatch(fetchSuppliers());
    dispatch(fetchProducts());
    
    if (isEditMode && id) {
      dispatch(fetchShippingOrder(id));
    } else {
      // 在新增模式下，設置焦點到供應商選擇欄位
      setTimeout(() => {
        try {
          // 嘗試方法1：使用ID選擇器
          const supplierSelect = document.querySelector('#supplier-select input');
          if (supplierSelect) {
            console.log('找到供應商選擇欄位，設置焦點');
            supplierSelect.focus();
            return;
          }
          
          // 嘗試方法2：使用更通用的選擇器
          const autocompleteInput = document.querySelector('.MuiAutocomplete-input');
          if (autocompleteInput) {
            console.log('找到自動完成輸入欄位，設置焦點');
            autocompleteInput.focus();
            return;
          }
          
          // 嘗試方法3：使用標籤選擇器
          const supplierLabel = document.querySelector('label:contains("供應商")');
          if (supplierLabel) {
            console.log('找到供應商標籤，嘗試設置焦點到相關輸入欄位');
            const input = supplierLabel.closest('.MuiFormControl-root').querySelector('input');
            if (input) {
              input.focus();
            }
          }
        } catch (error) {
          console.error('自動聚焦到供應商選擇欄位失敗:', error);
        }
      }, 800); // 延長時間確保DOM已完全載入
    }
  }, [dispatch, isEditMode, id]);
  
  // 確保suppliers數據已加載
  const [suppliersLoaded, setSuppliersLoaded] = useState(false);
  
  useEffect(() => {
    if (suppliers && suppliers.length > 0) {
      setSuppliersLoaded(true);
    }
  }, [suppliers]);
  
  // 在編輯模式下載入出貨單數據
  useEffect(() => {
    if (isEditMode && currentShippingOrder && suppliersLoaded) {
      console.log('設置編輯模式數據', currentShippingOrder);
      
      // 確保保留供應商信息
      const supplierData = {
        sosupplier: currentShippingOrder.sosupplier || '',
        supplier: currentShippingOrder.supplier || ''
      };
      
      setFormData({
        ...currentShippingOrder,
        ...supplierData // 確保供應商信息被保留
      });
      
      // 找到並設置當前選中的供應商
      if (currentShippingOrder.supplier) {
        const supplier = suppliers.find(s => 
          s._id === currentShippingOrder.supplier || 
          s._id === currentShippingOrder.supplier._id
        );
        if (supplier) {
          setSelectedSupplier(supplier);
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
  }, [isEditMode, currentShippingOrder, suppliersLoaded, suppliers]);
  
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
  

  
  const handleSupplierChange = (event, newValue) => {
    if (newValue) {
      setSelectedSupplier(newValue);
      setFormData({
        ...formData,
        sosupplier: newValue.name,
        supplier: newValue._id
      });
    } else {
      setSelectedSupplier(null);
      setFormData({
        ...formData,
        sosupplier: '',
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
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 驗證表單
    if (!formData.sosupplier) {
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
      ...formData
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
          handleSupplierChange={handleSupplierChange}
          suppliers={suppliers}
          selectedSupplier={selectedSupplier}
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
