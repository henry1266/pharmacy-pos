import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Snackbar,
  Alert
} from '@mui/material';
import { format } from 'date-fns';

import { 
  fetchPurchaseOrder, 
  addPurchaseOrder, 
  updatePurchaseOrder 
} from '../redux/actions';
import { fetchSuppliers } from '../redux/actions';
import { fetchProducts } from '../redux/actions';

// 導入拆分後的組件
import BasicInfoForm from '../components/purchase-order-form/BasicInfoForm';
import ProductItemForm from '../components/purchase-order-form/ProductItemForm';
import ProductItemsTable from '../components/purchase-order-form/ProductItemsTable';
import ConfirmDialog from '../components/purchase-order-form/ConfirmDialog';
import ActionButtons from '../components/purchase-order-form/ActionButtons';

const PurchaseOrderFormPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const { currentPurchaseOrder, loading, error } = useSelector(state => state.purchaseOrders);
  const { suppliers } = useSelector(state => state.suppliers);
  const { products } = useSelector(state => state.products);
  
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
  
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // 保存當前選中的供應商對象
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  
  useEffect(() => {
    dispatch(fetchSuppliers());
    dispatch(fetchProducts());
    
    if (isEditMode && id) {
      dispatch(fetchPurchaseOrder(id));
    }
  }, [dispatch, isEditMode, id]);
  
  // 確保suppliers數據已加載
  const [suppliersLoaded, setSuppliersLoaded] = useState(false);
  
  useEffect(() => {
    if (suppliers.length > 0) {
      setSuppliersLoaded(true);
    }
  }, [suppliers]);
  
  // 在編輯模式下載入進貨單數據
  useEffect(() => {
    if (isEditMode && currentPurchaseOrder && suppliersLoaded) {
      console.log('設置編輯模式數據', currentPurchaseOrder);
      
      // 確保保留供應商信息
      const supplierData = {
        posupplier: currentPurchaseOrder.posupplier || '',
        supplier: currentPurchaseOrder.supplier || ''
      };
      
      setFormData({
        ...currentPurchaseOrder,
        ...supplierData, // 確保供應商信息被保留
        pobilldate: currentPurchaseOrder.pobilldate ? new Date(currentPurchaseOrder.pobilldate) : new Date()
      });
      
      // 找到並設置當前選中的供應商
      if (currentPurchaseOrder.supplier) {
        const supplier = suppliers.find(s => 
          s._id === currentPurchaseOrder.supplier || 
          s._id === currentPurchaseOrder.supplier._id
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
  }, [isEditMode, currentPurchaseOrder, suppliersLoaded, suppliers]);
  
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
      pobilldate: format(formData.pobilldate, 'yyyy-MM-dd')
    };
    
    if (isEditMode) {
      dispatch(updatePurchaseOrder(id, submitData, navigate));
    } else {
      dispatch(addPurchaseOrder(submitData, navigate));
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
    navigate('/purchase-orders');
  };
  
  // 計算總金額
  const totalAmount = formData.items.reduce((sum, item) => sum + Number(item.dtotalCost), 0);
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditMode ? '編輯進貨單' : '新增進貨單'}
      </Typography>
      
      <form onSubmit={handleSubmit}>
        {/* 基本資訊表單 */}
        <BasicInfoForm 
          formData={formData}
          handleInputChange={handleInputChange}
          handleDateChange={handleDateChange}
          handleSupplierChange={handleSupplierChange}
          suppliers={suppliers}
          selectedSupplier={selectedSupplier}
          isEditMode={isEditMode}
        />
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              藥品項目
            </Typography>
            
            {/* 藥品項目添加表單 */}
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
        
        {/* 操作按鈕 */}
        <ActionButtons 
          loading={loading}
          onCancel={handleCancel}
        />
      </form>
      
      {/* 確認對話框 */}
      <ConfirmDialog 
        open={confirmDialogOpen}
        onClose={handleCancelComplete}
        onConfirm={handleConfirmComplete}
      />
      
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

export default PurchaseOrderFormPage;
