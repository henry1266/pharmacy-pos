import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  Card,
  CardContent,
  SelectChangeEvent
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';

// Import service functions
import { getPurchaseOrderById, updatePurchaseOrder, addPurchaseOrder } from '../services/purchaseOrdersService';
import { getProducts } from '../services/productService';
import { getSuppliers } from '../services/supplierService';

// Import components
import BasicInfoForm from '../components/purchase-order-form/BasicInfoForm';
import ProductItemForm from '../components/purchase-order-form/ProductItemForm';
import ProductItemsTable from '../components/purchase-order-form/ProductItemsTable';
import ActionButtons from '../components/purchase-order-form/ActionButtons';

// 定義介面
interface Supplier {
  _id: string;
  id?: string;
  name: string;
  shortCode?: string;
  [key: string]: any;
}

interface Product {
  _id: string;
  id?: string;
  code: string;
  name: string;
  shortCode?: string;
  productType?: string;
  healthInsuranceCode?: string;
  barcode?: string;
  purchasePrice?: string | number;
  [key: string]: any;
}

interface FormData {
  poid: string;
  pobill: string;
  pobilldate: Date;
  posupplier: string;
  supplier: string;
  items: PurchaseOrderItem[];
  notes: string;
  status: string;
  paymentStatus: string;
  multiplierMode?: string | number;
  [key: string]: any;
}

// 擴展 PurchaseOrder 類型以包含實際使用的欄位
interface ExtendedPurchaseOrder {
  _id: string;
  orderNumber: string;
  orderDate: string | Date;
  expectedDeliveryDate?: string | Date;
  totalAmount: number;
  status: string;
  notes?: string;
  createdBy?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  supplier?: string | { _id: string; name: string; [key: string]: any };
  items?: any[];
  pobilldate?: string | Date;
  pobill?: string;
  poid?: string;
  posupplier?: string;
  paymentStatus?: string;
  [key: string]: any;
}

interface PurchaseOrderItem {
  _id?: string;
  did: string;
  dname: string;
  dquantity: string | number;
  dtotalCost: string | number;
  product: string | null;
  [key: string]: any;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

// Helper to check if a string is a valid MongoDB ObjectId
const isValidObjectId = (id: string): boolean => /^[0-9a-fA-F]{24}$/.test(id);

const PurchaseOrderEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const productInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    poid: '', // Purchase Order ID (user input or auto-generated for new)
    pobill: '',
    pobilldate: new Date(),
    posupplier: '', // Supplier name for display
    supplier: '', // Supplier ObjectId for submission
    items: [],
    notes: '',
    status: '處理中',
    paymentStatus: '未付款'
  });

  const [currentItem, setCurrentItem] = useState<PurchaseOrderItem>({
    did: '', // Product code for display
    dname: '', // Product name for display
    dquantity: '',
    dtotalCost: '',
    product: null // Product ObjectId for submission
  });

  const [editingItemIndex, setEditingItemIndex] = useState<number>(-1);
  const [editingItem, setEditingItem] = useState<PurchaseOrderItem | null>(null);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [orderDataLoaded, setOrderDataLoaded] = useState<boolean>(!isEditMode); // True if new order
  const [suppliersLoaded, setSuppliersLoaded] = useState<boolean>(false);
  const [productsLoaded, setProductsLoaded] = useState<boolean>(false);

  const isTestMode = (): boolean => localStorage.getItem('isTestMode') === 'true';

  const fetchPurchaseOrderData = async (): Promise<any> => {
    if (!isEditMode) {
      setOrderDataLoaded(true);
      return;
    }
    try {
      const orderData = await getPurchaseOrderById(id as string) as ExtendedPurchaseOrder;
      setFormData(prevData => ({
        ...prevData,
        ...orderData,
        pobilldate: orderData.pobilldate ? new Date(orderData.pobilldate) : new Date(),
        supplier: typeof orderData.supplier === 'object' ? orderData.supplier._id : (orderData.supplier || ''),
        posupplier: typeof orderData.supplier === 'object' ? orderData.supplier.name : '',
        items: orderData.items ? orderData.items.map((item: any) => ({ // Ensure items have product ObjectId
          ...item,
          product: typeof item.product === 'object' ? item.product._id : (item.product || null)
        })) : []
      }));
      setOrderDataLoaded(true);
      return orderData;
    } catch (err: any) {
      setError('獲取進貨單數據失敗');
      setSnackbar({ open: true, message: '獲取進貨單數據失敗: ' + (err.response?.data?.msg || err.message || '未知錯誤'), severity: 'error' });
      throw err;
    }
  };

  const fetchProductsData = async (): Promise<Product[]> => {
    try {
      const productsData = await getProducts();
      setProducts(productsData || []);
      setProductsLoaded(true);
      return productsData;
    } catch (err: any) {
      setSnackbar({ open: true, message: '獲取產品數據失敗: ' + (err.response?.data?.msg || err.message || '未知錯誤'), severity: 'error' });
      throw err;
    }
  };

  const fetchSuppliersData = async (): Promise<Supplier[]> => {
    try {
      const suppliersData = await getSuppliers();
      setSuppliers(suppliersData || []);
      setSuppliersLoaded(true);
      return suppliersData;
    } catch (err: any) {
      setSnackbar({ open: true, message: '獲取供應商數據失敗: ' + (err.response?.data?.msg || err.message || '未知錯誤'), severity: 'error' });
      throw err;
    }
  };

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const promises = [fetchProductsData(), fetchSuppliersData()];
        if (isEditMode) {
          promises.push(fetchPurchaseOrderData());
        }
        await Promise.all(promises);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        console.error('載入數據時發生錯誤:', err);
      }
    };
    loadData();
  }, [id, isEditMode]);

  useEffect(() => {
    if (orderDataLoaded && suppliersLoaded && formData.supplier) {
      const supplierObj = suppliers.find(s => s._id === formData.supplier || s.id === formData.supplier);
      if (supplierObj) {
        setSelectedSupplier(supplierObj);
        if (formData.posupplier !== supplierObj.name) {
             setFormData(prev => ({ ...prev, posupplier: supplierObj.name }));
        }
      } else {
        setSelectedSupplier(null);
      }
    }
  }, [orderDataLoaded, suppliersLoaded, formData.supplier, suppliers]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null): void => {
    setFormData(prev => ({ ...prev, pobilldate: date || new Date() }));
  };

  const handleSupplierChange = (supplier: Supplier | null): void => {
    setSelectedSupplier(supplier);
    setFormData(prev => ({
      ...prev,
      posupplier: supplier ? supplier.name : '',
      supplier: supplier ? (supplier._id || supplier.id || '') : '' // Store ObjectId
    }));
  };

  const handleItemInputChange = (e: { target: { name: string; value: string } }): void => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleEditingItemChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setEditingItem(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleProductChange = (event: React.SyntheticEvent, newValue: Product | null): void => {
    setCurrentItem(prev => ({
      ...prev,
      did: newValue ? newValue.code : '',
      dname: newValue ? newValue.name : '',
      product: newValue ? (newValue._id || newValue.id || '') : null, // Store ObjectId
      dquantity: '',
      dtotalCost: ''
    }));
  };

  const handleAddItem = (): void => {
    if (!currentItem.product || !currentItem.dname || currentItem.dquantity === undefined || currentItem.dquantity === null || currentItem.dquantity === '' || currentItem.dtotalCost === '') {
      setSnackbar({ open: true, message: '請填寫完整的藥品項目資料 (藥品、數量、總成本)', severity: 'error' });
      return;
    }
    // Ensure product ID is valid before adding if not in test mode
    if (!isTestMode() && !isValidObjectId(currentItem.product as string)) {
        setSnackbar({ open: true, message: '無效的藥品ID，請重新選擇藥品。', severity: 'error' });
        return;
    }
    const newItem = { ...currentItem }; 
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setCurrentItem({ did: '', dname: '', dquantity: '', dtotalCost: '', product: null });
    setTimeout(() => {
      const productInput = document.querySelector('#product-select-input');
      if (productInput) (productInput as HTMLInputElement).focus();
    }, 100);
  };

  const handleRemoveItem = (index: number): void => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleEditItem = (index: number): void => {
    setEditingItemIndex(index);
    const itemToEdit = formData.items[index];
    // Ensure product ID is valid if not in test mode
    if (!isTestMode() && itemToEdit.product && !isValidObjectId(itemToEdit.product as string)){
        setSnackbar({ open: true, message: `項目 ${itemToEdit.dname} 的藥品ID無效，請修正。`, severity: 'error' });
        // Potentially clear the product or handle differently
    }
    setEditingItem({ ...itemToEdit }); 
  };

  // 將複雜的 handleSubmit 函數拆分為多個較小的函數
  const validateFormData = (): boolean => {
    if (!formData.supplier) {
      setSnackbar({ open: true, message: '請選擇一個供應商', severity: 'error' });
      return false;
    }
    if (formData.items.length === 0) {
      setSnackbar({ open: true, message: '請至少添加一個藥品項目', severity: 'error' });
      return false;
    }
    return true;
  };

  const validateItemsForSubmit = (): PurchaseOrderItem[] | null => {
    // 只在非測試模式下進行驗證
    if (!isTestMode()) {
      if (!isValidObjectId(formData.supplier)) {
        setSnackbar({ open: true, message: '供應商ID無效，請重新選擇供應商。', severity: 'error' });
        return null;
      }

      try {
        const validItems = formData.items.map(item => {
          if (!isValidObjectId(item.product as string)) {
            throw new Error(`藥品 ${item.dname || '未知藥品'} 的ID格式不正確。`);
          }
          return {
            product: item.product,
            dquantity: parseFloat(item.dquantity as string),
            dtotalCost: parseFloat(item.dtotalCost as string),
            did: item.did,
            dname: item.dname
          };
        }).filter(item => isValidObjectId(item.product as string));

        if (validItems.length !== formData.items.length) {
          setSnackbar({ open: true, message: '部分藥品項目因ID無效已被過濾，請檢查。', severity: 'warning' });
        }
        if (validItems.length === 0 && formData.items.length > 0) {
          setSnackbar({ open: true, message: '所有藥品項目ID均無效，無法提交。', severity: 'error' });
          return null;
        }
        return validItems;
      } catch (error: any) {
        setSnackbar({ open: true, message: error.message, severity: 'error' });
        return null;
      }
    }
    return formData.items;
  };

  const prepareSubmitData = (itemsForSubmit: PurchaseOrderItem[]): any => {
    const submitData = {
      ...formData,
      pobilldate: format(new Date(formData.pobilldate), 'yyyy-MM-dd'),
      supplier: formData.supplier,
      items: itemsForSubmit,
      posupplier: undefined,
    };
    
    if (!isEditMode && !submitData.poid) {
      delete submitData.poid;
    }
    
    return submitData;
  };

  const submitFormData = async (submitData: any): Promise<void> => {
    try {
      if (isEditMode) {
        await updatePurchaseOrder(id as string, submitData);
        setSnackbar({ open: true, message: '進貨單已成功更新', severity: 'success' });
      } else {
        await addPurchaseOrder(submitData);
        setSnackbar({ open: true, message: '進貨單已成功新增', severity: 'success' });
      }
      setTimeout(() => { navigate('/purchase-orders'); }, 1500);
    } catch (err: any) {
      console.error(isEditMode ? '更新進貨單失敗:' : '新增進貨單失敗:', err);
      setSnackbar({
        open: true,
        message: (isEditMode ? '更新進貨單失敗: ' : '新增進貨單失敗: ') + (err.response?.data?.msg || err.message || '未知錯誤'),
        severity: 'error'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateFormData()) {
      return;
    }
    
    const itemsForSubmit = validateItemsForSubmit();
    if (itemsForSubmit === null) {
      return;
    }
    
    const submitData = prepareSubmitData(itemsForSubmit);
    await submitFormData(submitData);
  };

  const handleSaveEditItem = (): void => {
    if (!editingItem?.product || !editingItem?.dname || editingItem?.dquantity === undefined || editingItem?.dquantity === null || editingItem?.dquantity === '' || editingItem?.dtotalCost === '') {
      setSnackbar({ open: true, message: '請填寫完整的藥品項目資料', severity: 'error' });
      return;
    }
    // Ensure product ID is valid before saving if not in test mode
    if (!isTestMode() && !isValidObjectId(editingItem.product as string)) {
        setSnackbar({ open: true, message: '無效的藥品ID，請重新選擇藥品。', severity: 'error' });
        return;
    }
    const newItems = [...formData.items];
    newItems[editingItemIndex] = editingItem;
    setFormData(prev => ({ ...prev, items: newItems }));
    setEditingItemIndex(-1);
    setEditingItem(null);
  };

  const handleCancelEditItem = (): void => {
    setEditingItemIndex(-1);
    setEditingItem(null);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down'): void => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === formData.items.length - 1)) return;
    const newItems = [...formData.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string): void => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCancel = () => navigate('/purchase-orders');

  const totalAmount = formData.items.reduce((sum, item) => sum + Number(item.dtotalCost || 0), 0);

  if (loading && !orderDataLoaded && !productsLoaded && !suppliersLoaded) {
    return <Box sx={{ p: 3, textAlign: 'center' }}><Typography>載入中...</Typography></Box>;
  }
  if (error && !orderDataLoaded) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" onClick={() => navigate('/purchase-orders')} sx={{ mt: 2 }}>返回進貨單列表</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">{isEditMode ? '編輯進貨單' : '新增進貨單'}</Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleCancel}>返回進貨單列表</Button>
      </Box>

      <form onSubmit={handleSubmit}>
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
            <Typography variant="h6" gutterBottom>藥品項目</Typography>
            <ProductItemForm
              currentItem={currentItem}
              handleItemInputChange={handleItemInputChange}
              handleProductChange={handleProductChange}
              handleAddItem={handleAddItem}
              products={products}
              productInputRef={productInputRef}
            />
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
             <ActionButtons
              loading={loading}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </form>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseOrderEditPage;