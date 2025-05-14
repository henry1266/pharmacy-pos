import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Removed axios import
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

// Import service functions
import { getPurchaseOrderById, updatePurchaseOrder } from '../services/purchaseOrdersService';
import { getProducts } from '../services/productService';
import { getSuppliers } from '../services/supplierService';

// Import components
import BasicInfoForm from '../components/purchase-order-form/BasicInfoForm';
import ProductItemForm from '../components/purchase-order-form/ProductItemForm';
import ProductItemsTable from '../components/purchase-order-form/ProductItemsTable';
import ActionButtons from '../components/purchase-order-form/ActionButtons';

const PurchaseOrderEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // State management
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    poid: '',
    pobill: '',
    pobilldate: new Date(),
    posupplier: '',
    supplier: '', // This should store the supplier ID
    items: [],
    notes: '',
    status: '處理中',
    paymentStatus: '未付款'
  });

  const [currentItem, setCurrentItem] = useState({
    did: '',
    dname: '',
    dquantity: '',
    dtotalCost: '',
    product: null // This should store the product ID
  });

  const [editingItemIndex, setEditingItemIndex] = useState(-1);
  const [editingItem, setEditingItem] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [orderDataLoaded, setOrderDataLoaded] = useState(false);
  const [suppliersLoaded, setSuppliersLoaded] = useState(false);

  // Refactored fetch functions using services
  const fetchPurchaseOrderData = async () => {
    try {
      const orderData = await getPurchaseOrderById(id);
      console.log('獲取到進貨單數據:', orderData);
      setFormData({
        ...orderData,
        pobilldate: orderData.pobilldate ? new Date(orderData.pobilldate) : new Date(),
        // Ensure supplier field holds the ID if the API returns a populated object
        supplier: typeof orderData.supplier === 'object' ? orderData.supplier._id : orderData.supplier
      });
      setOrderDataLoaded(true);
      return orderData;
    } catch (err) {
      console.error('獲取進貨單數據失敗:', err);
      setError('獲取進貨單數據失敗');
      setSnackbar({
        open: true,
        message: '獲取進貨單數據失敗: ' + (err.response?.data?.msg || err.message || '未知錯誤'),
        severity: 'error'
      });
      throw err;
    }
  };

  const fetchProducts = async () => {
    try {
      const productsData = await getProducts();
      setProducts(productsData);
      return productsData;
    } catch (err) {
      console.error('獲取產品數據失敗:', err);
      setSnackbar({
        open: true,
        message: '獲取產品數據失敗: ' + (err.response?.data?.msg || err.message || '未知錯誤'),
        severity: 'error'
      });
      throw err;
    }
  };

  const fetchSuppliers = async () => {
    try {
      const suppliersData = await getSuppliers(); // Uses supplierService which maps _id to id
      console.log('獲取到供應商數據:', suppliersData);
      setSuppliers(suppliersData);
      setSuppliersLoaded(true);
      return suppliersData;
    } catch (err) {
      console.error('獲取供應商數據失敗:', err);
      setSnackbar({
        open: true,
        message: '獲取供應商數據失敗: ' + (err.response?.data?.msg || err.message || '未知錯誤'),
        severity: 'error'
      });
      throw err;
    }
  };

  // Initial data loading useEffect
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([
          fetchPurchaseOrderData(),
          fetchProducts(),
          fetchSuppliers()
        ]);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        console.error('加載數據過程中發生錯誤:', err);
        // Error state is set within individual fetch functions
      }
    };
    loadData();
  }, [id]); // Removed fetchPurchaseOrderData from dependencies as it's stable

  // useEffect for setting selected supplier based on loaded data
  useEffect(() => {
    if (orderDataLoaded && suppliersLoaded && formData.supplier) {
      console.log('Attempting to find supplier for ID:', formData.supplier);
      const supplier = suppliers.find(s => s.id === formData.supplier || s._id === formData.supplier);
      if (supplier) {
        console.log('找到匹配的供應商:', supplier);
        setSelectedSupplier(supplier);
        if (formData.posupplier !== supplier.name) {
             setFormData(prev => ({ ...prev, posupplier: supplier.name }));
        }
      } else {
        console.log('未找到匹配的供應商 for ID:', formData.supplier);
        setSelectedSupplier(null);
      }
    } else if (!formData.supplier) {
        setSelectedSupplier(null);
    }
  }, [orderDataLoaded, suppliersLoaded, formData.supplier, suppliers, formData.posupplier]); // Added formData.posupplier

  // Input change handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevFormData => ({ ...prevFormData, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData(prevFormData => ({ ...prevFormData, pobilldate: date }));
  };

  const handleSupplierChange = (event, newValue) => {
    if (newValue) {
      setSelectedSupplier(newValue);
      setFormData(prevFormData => ({ ...prevFormData, posupplier: newValue.name, supplier: newValue.id }));
    } else {
      setSelectedSupplier(null);
      setFormData(prevFormData => ({ ...prevFormData, posupplier: '', supplier: '' }));
    }
  };

  // Item input change handlers
  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prevCurrentItem => ({
      ...prevCurrentItem,
      [name]: value
    }));
  };

  const handleEditingItemChange = (e) => {
    const { name, value } = e.target;
    setEditingItem(prevEditingItem => ({
      ...prevEditingItem,
      [name]: value
    }));
  };

  const handleProductChange = (event, newValue) => {
    if (newValue) {
      setCurrentItem(prevCurrentItem => ({
        ...prevCurrentItem,
        did: newValue.code, 
        dname: newValue.name,
        product: newValue._id,
        dquantity: '', // Reset quantity when product changes
        dtotalCost: ''  // Reset total cost when product changes
      }));
    } else {
      setCurrentItem(prevCurrentItem => ({
        ...prevCurrentItem,
        did: '', 
        dname: '', 
        product: null,
        dquantity: '',
        dtotalCost: ''
      }));
    }
  };

  const handleAddItem = () => {
    if (!currentItem.product || !currentItem.dname || !currentItem.dquantity || currentItem.dtotalCost === '') {
      setSnackbar({ open: true, message: '請填寫完整的藥品項目資料 (藥品、數量、總成本)', severity: 'error' });
      return;
    }
    const newItem = { ...currentItem }; 
    setFormData(prevFormData => ({ ...prevFormData, items: [...prevFormData.items, newItem] }));
    setCurrentItem({ did: '', dname: '', dquantity: '', dtotalCost: '', product: null });
    setTimeout(() => {
      const productInput = document.querySelector('#product-select-input');
      if (productInput) productInput.focus();
    }, 100);
  };

  const handleRemoveItem = (index) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      items: prevFormData.items.filter((_, i) => i !== index)
    }));
  };

  const handleEditItem = (index) => {
    setEditingItemIndex(index);
    setEditingItem({ ...formData.items[index] }); 
  };

  const handleSaveEditItem = () => {
    if (!editingItem || !editingItem.product || !editingItem.dname || !editingItem.dquantity || editingItem.dtotalCost === '') {
      setSnackbar({ open: true, message: '請填寫完整的藥品項目資料', severity: 'error' });
      return;
    }
    const newItems = [...formData.items];
    newItems[editingItemIndex] = editingItem;
    setFormData(prevFormData => ({ ...prevFormData, items: newItems }));
    setEditingItemIndex(-1);
    setEditingItem(null);
  };

  const handleCancelEditItem = () => {
    setEditingItemIndex(-1);
    setEditingItem(null);
  };

  const handleMoveItem = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === formData.items.length - 1)) return;
    const newItems = [...formData.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setFormData(prevFormData => ({ ...prevFormData, items: newItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.poid || !formData.supplier) { // posupplier is derived from supplier
      setSnackbar({ open: true, message: '請填寫所有必填欄位 (單號, 供應商)', severity: 'error' });
      return;
    }
    if (formData.items.length === 0) {
      setSnackbar({ open: true, message: '請至少添加一個藥品項目', severity: 'error' });
      return;
    }

    try {
      const submitData = {
        ...formData,
        pobilldate: format(new Date(formData.pobilldate), 'yyyy-MM-dd'),
        items: formData.items.map(item => ({ 
            ...item,
            product: item.product 
        }))
      };

      await updatePurchaseOrder(id, submitData);
      setSnackbar({ open: true, message: '進貨單已成功更新', severity: 'success' });
      setTimeout(() => { navigate('/purchase-orders'); }, 1500);

    } catch (err) {
      console.error('更新進貨單失敗:', err);
      setSnackbar({
        open: true,
        message: '更新進貨單失敗: ' + (err.response?.data?.msg || err.message || '未知錯誤'),
        severity: 'error'
      });
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCancel = () => {
    navigate('/purchase-orders');
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + Number(item.dtotalCost || 0), 0);

  if (loading && !orderDataLoaded) { // Show loading only if initial order data isn't loaded
    return <Box sx={{ p: 3, textAlign: 'center' }}><Typography>載入中...</Typography></Box>;
  }
  if (error && !orderDataLoaded) { // Show error only if initial order data failed to load
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" onClick={() => navigate('/purchase-orders')} sx={{ mt: 2 }}>
          返回進貨單列表
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">編輯進貨單</Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleCancel}>
          返回進貨單列表
        </Button>
      </Box>

      <form onSubmit={handleSubmit}>
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
            <Typography variant="h6" gutterBottom>藥品項目</Typography>
            <ActionButtons
              onSave={handleSubmit}
              onCancel={handleCancel}
            />
            <ProductItemForm
              currentItem={currentItem}
              handleItemInputChange={handleItemInputChange}
              handleProductChange={handleProductChange}
              handleAddItem={handleAddItem}
              products={products}
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

