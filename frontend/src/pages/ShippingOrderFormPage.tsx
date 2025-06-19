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

// 假設你的 Redux actions 和 store state 已經有了基本的型別定義
import { 
  fetchShippingOrder, 
  addShippingOrder, 
  updateShippingOrder,
  fetchSuppliers,
  fetchProducts
} from '../redux/actions';
import { RootState } from '../redux/store'; // 假設你有一個 RootState 型別

// 導入拆分後的組件
import BasicInfoForm from '../components/shipping-orders/form/BasicInfo';
import ProductItemForm from '../components/shipping-orders/form/ProductItems/ItemForm.tsx';
import ItemsTable from '../components/shipping-orders/form/ProductItems/ItemsTable.tsx';
import GenericConfirmDialog from '../components/common/GenericConfirmDialog';

// =================================================================
// 1. 型別定義 (Type Definitions)
// =================================================================

// 供應商的型別
interface ISupplier {
  _id: string;
  name: string;
  // ... 其他供應商屬性
}

// 產品的型別
interface IProduct {
  _id: string;
  code: string;
  name:string;
  // ... 其他產品屬性
}

// 訂單項目的型別
interface IOrderItem {
  did: string;
  dname: string;
  dquantity: number | string; // 允許輸入時為 string
  dtotalCost: number | string; // 允許輸入時為 string
  product: string | null; // 儲存 product ID
}

// 表單資料的完整型別
interface IShippingOrderForm {
  _id?: string; // 在編輯模式下會有
  soid: string;
  sosupplier: string;
  supplier: string; // 儲存 supplier ID
  items: IOrderItem[];
  notes: string;
  status: 'pending' | 'completed' | 'cancelled';
  paymentStatus: '未收' | '已收';
}

interface ISnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// =================================================================
// 2. 組件實作 (Component Implementation)
// =================================================================

const ShippingOrderFormPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  // 使用 RootState 來為 useSelector 提供型別
  const { currentShippingOrder, loading, error } = useSelector((state: RootState) => state.shippingOrders);
  const { suppliers } = useSelector((state: RootState) => state.suppliers);
  const { products } = useSelector((state: RootState) => state.products);

  const [formData, setFormData] = useState<IShippingOrderForm>({
    soid: '',
    sosupplier: '',
    supplier: '',
    items: [],
    notes: '',
    status: 'pending',
    paymentStatus: '未收'
  });
  
  const [currentItem, setCurrentItem] = useState<IOrderItem>({
    did: '',
    dname: '',
    dquantity: '',
    dtotalCost: '',
    product: null
  });
  
  const [editingItemIndex, setEditingItemIndex] = useState<number>(-1);
  const [editingItem, setEditingItem] = useState<IOrderItem | null>(null);
  
  const [snackbar, setSnackbar] = useState<ISnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  
  // 保存當前選中的供應商對象，這對於MUI Autocomplete的value屬性很重要
  const [selectedSupplier, setSelectedSupplier] = useState<ISupplier | null>(null);
  
  useEffect(() => {
    dispatch(fetchSuppliers());
    dispatch(fetchProducts());
    
    if (isEditMode && id) {
      dispatch(fetchShippingOrder(id));
    }
    
    // FIX: 移除所有不穩定的 `document.querySelector` 和 `setTimeout` 來自動聚焦。
    // 自動聚焦的功能將會透過 `autoFocus` prop 傳遞給子組件來實現。

  }, [dispatch, isEditMode, id]);
  
  // 在編輯模式下載入出貨單數據
  useEffect(() => {
    // 確保 currentShippingOrder 和 suppliers 都已載入
    if (isEditMode && currentShippingOrder && suppliers.length > 0) {
      // 將從 Redux 來的資料設定到表單中
      setFormData({
        ...currentShippingOrder,
        supplier: typeof currentShippingOrder.supplier === 'object' 
          ? (currentShippingOrder.supplier as ISupplier)._id 
          : currentShippingOrder.supplier,
      });
      
      // 找到並設置當前選中的供應商物件，以正確顯示在 Autocomplete 中
      const supplierId = typeof currentShippingOrder.supplier === 'object' 
        ? (currentShippingOrder.supplier as ISupplier)._id 
        : currentShippingOrder.supplier;
        
      const foundSupplier = suppliers.find(s => s._id === supplierId);
      if (foundSupplier) {
        setSelectedSupplier(foundSupplier);
      }
    }
  }, [isEditMode, currentShippingOrder, suppliers]);
  
  useEffect(() => {
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: 'error'
      });
    }
  }, [error]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSupplierChange = (_event: React.SyntheticEvent, newValue: ISupplier | null) => {
    setSelectedSupplier(newValue);
    setFormData({
      ...formData,
      sosupplier: newValue ? newValue.name : '',
      supplier: newValue ? newValue._id : ''
    });
  };
  
  const handleItemInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCurrentItem({
      ...currentItem,
      [e.target.name]: e.target.value
    });
  };

  const handleEditingItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        [e.target.name]: e.target.value
      });
    }
  };
  
  const handleProductChange = (_event: React.SyntheticEvent, newValue: IProduct | null) => {
    setCurrentItem({
      ...currentItem,
      did: newValue ? newValue.code : '',
      dname: newValue ? newValue.name : '',
      product: newValue ? newValue._id : null
    });
  };
  
  const handleAddItem = () => {
    if (!currentItem.did || !currentItem.dname || !currentItem.dquantity || currentItem.dtotalCost === '') {
      setSnackbar({ open: true, message: '請填寫完整的藥品項目資料', severity: 'error' });
      return;
    }
    
    setFormData({
      ...formData,
      items: [...formData.items, currentItem]
    });
    
    // 清空當前項目
    setCurrentItem({ did: '', dname: '', dquantity: '', dtotalCost: '', product: null });
    
    // FIX: 聚焦操作應該由 ProductItemForm 組件內部處理，而不是在這裡直接操作 DOM
  };
  
  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };
  
  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
    setEditingItem({ ...formData.items[index] });
  };
  
  const handleSaveEditItem = () => {
    if (!editingItem || !editingItem.did || !editingItem.dname || !editingItem.dquantity || editingItem.dtotalCost === '') {
      setSnackbar({ open: true, message: '請填寫完整的藥品項目資料', severity: 'error' });
      return;
    }
    
    const newItems = [...formData.items];
    newItems[editingItemIndex] = editingItem;
    setFormData({ ...formData, items: newItems });
    
    setEditingItemIndex(-1);
    setEditingItem(null);
  };
  
  const handleCancelEditItem = () => {
    setEditingItemIndex(-1);
    setEditingItem(null);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === formData.items.length - 1)) {
      return;
    }
    
    const newItems = [...formData.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    setFormData({ ...formData, items: newItems });
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.supplier) {
      setSnackbar({ open: true, message: '請選擇一個供應商', severity: 'error' });
      return;
    }
    
    if (formData.items.length === 0) {
      setSnackbar({ open: true, message: '請至少添加一個藥品項目', severity: 'error' });
      return;
    }
    
    if (formData.status === 'completed') {
      setConfirmDialogOpen(true);
      return;
    }
    
    submitForm();
  };
  
  const submitForm = () => {
    // 確保提交的數據型別正確
    const submitData: IShippingOrderForm = {
      ...formData,
      items: formData.items.map(item => ({
        ...item,
        dquantity: Number(item.dquantity),
        dtotalCost: Number(item.dtotalCost),
      }))
    };
    
    if (isEditMode && id) {
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
  
  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };
  
  const handleCancel = () => {
    navigate('/shipping-orders');
  };
  
  const totalAmount = formData.items.reduce((sum, item) => sum + Number(item.dtotalCost || 0), 0);
  
  return (
    <Box>
      <Typography variant="h5" component="h1" gutterBottom>
        {isEditMode ? '編輯出貨單' : '新增出貨單'}
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <BasicInfoForm 
          formData={formData}
          handleInputChange={handleInputChange}
          handleSupplierChange={handleSupplierChange}
          suppliers={suppliers}
          selectedSupplier={selectedSupplier}
          isEditMode={isEditMode}
          // FIX: 傳遞 autoFocus 屬性給子組件
          autoFocus={!isEditMode}
        />
        
        <Card sx={{ mb: 1 }}>
          <CardContent sx={{ pb: 1 }}>
            <Typography variant="h6">藥品項目</Typography>
            
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" color="primary" type="submit" disabled={loading} sx={{ mr: 1 }}>
                {isEditMode ? '保存' : '創建'}
              </Button>
              <Button variant="outlined" color="secondary" onClick={handleCancel} disabled={loading}>
                取消
              </Button>
            </Box>
            
            <Box sx={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10, pb: 1, borderBottom: '1px solid #e0e0e0' }}>
              <ProductItemForm 
                currentItem={currentItem}
                handleItemInputChange={handleItemInputChange}
                handleProductChange={handleProductChange}
                handleAddItem={handleAddItem}
                products={products}
                 // FIX: 傳遞 autoFocus 屬性給子組件
                autoFocus={isEditMode}
              />
            </Box>
            
            <Box sx={{ height: 'calc(100vh - 550px)', minHeight: '250px', overflowY: 'auto' }}>
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
        
        <GenericConfirmDialog 
          open={confirmDialogOpen}
          onClose={handleCancelComplete}
          onConfirm={handleConfirmComplete}
          title="確認完成出貨單" 
          message="您確定要將此出貨單標記為完成並提交嗎？此操作將更新相關庫存。" 
          confirmText="確認完成"
          cancelText="取消"
        />
      </form>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ShippingOrderFormPage;