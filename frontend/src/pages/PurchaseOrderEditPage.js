import React, { useState, useEffect } from 'react';
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
import { getPurchaseOrderById, updatePurchaseOrder, addPurchaseOrder } from '../services/purchaseOrdersService'; // Added addPurchaseOrder
import { getProducts } from '../services/productService';
import { getSuppliers } from '../services/supplierService';

// Import components
import BasicInfoForm from '../components/purchase-order-form/BasicInfoForm';
import ProductItemForm from '../components/purchase-order-form/ProductItemForm';
import ProductItemsTable from '../components/purchase-order-form/ProductItemsTable';
import ActionButtons from '../components/purchase-order-form/ActionButtons';

// Helper to check if a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const PurchaseOrderEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // id will be undefined for new orders
  const isEditMode = !!id;

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
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

  const [currentItem, setCurrentItem] = useState({
    did: '', // Product code for display
    dname: '', // Product name for display
    dquantity: '',
    dtotalCost: '',
    product: null // Product ObjectId for submission
  });

  const [editingItemIndex, setEditingItemIndex] = useState(-1);
  const [editingItem, setEditingItem] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [orderDataLoaded, setOrderDataLoaded] = useState(!isEditMode); // True if new order
  const [suppliersLoaded, setSuppliersLoaded] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);

  const isTestMode = () => localStorage.getItem('isTestMode') === 'true';

  const fetchPurchaseOrderData = async () => {
    if (!isEditMode) {
      setOrderDataLoaded(true);
      return;
    }
    try {
      const orderData = await getPurchaseOrderById(id);
      setFormData({
        ...orderData,
        pobilldate: orderData.pobilldate ? new Date(orderData.pobilldate) : new Date(),
        supplier: orderData.supplier?._id || orderData.supplier, // Ensure it's the ID
        posupplier: orderData.supplier?.name || '',
        items: orderData.items ? orderData.items.map(item => ({ // Ensure items have product ObjectId
          ...item,
          product: item.product?._id || item.product
        })) : []
      });
      setOrderDataLoaded(true);
      return orderData;
    } catch (err) {
      setError('獲取進貨單數據失敗');
      setSnackbar({ open: true, message: '獲取進貨單數據失敗: ' + (err.response?.data?.msg || err.message || '未知錯誤'), severity: 'error' });
      throw err;
    }
  };

  const fetchProductsData = async () => {
    try {
      const productsData = await getProducts();
      setProducts(productsData || []);
      setProductsLoaded(true);
      return productsData;
    } catch (err) {
      setSnackbar({ open: true, message: '獲取產品數據失敗: ' + (err.response?.data?.msg || err.message || '未知錯誤'), severity: 'error' });
      throw err;
    }
  };

  const fetchSuppliersData = async () => {
    try {
      const suppliersData = await getSuppliers();
      setSuppliers(suppliersData || []);
      setSuppliersLoaded(true);
      return suppliersData;
    } catch (err) {
      setSnackbar({ open: true, message: '獲取供應商數據失敗: ' + (err.response?.data?.msg || err.message || '未知錯誤'), severity: 'error' });
      throw err;
    }
  };

  useEffect(() => {
    const loadData = async () => {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, pobilldate: date }));
  };

  const handleSupplierChange = (event, newValue) => {
    setSelectedSupplier(newValue);
    setFormData(prev => ({
      ...prev,
      posupplier: newValue ? newValue.name : '',
      supplier: newValue ? (newValue._id || newValue.id) : '' // Store ObjectId
    }));
  };

  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleEditingItemChange = (e) => {
    const { name, value } = e.target;
    setEditingItem(prev => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (event, newValue) => {
    setCurrentItem(prev => ({
      ...prev,
      did: newValue ? newValue.code : '',
      dname: newValue ? newValue.name : '',
      product: newValue ? (newValue._id || newValue.id) : null, // Store ObjectId
      dquantity: '',
      dtotalCost: ''
    }));
  };

  const handleAddItem = () => {
    if (!currentItem.product || !currentItem.dname || !currentItem.dquantity || currentItem.dtotalCost === '') {
      setSnackbar({ open: true, message: '請填寫完整的藥品項目資料 (藥品、數量、總成本)', severity: 'error' });
      return;
    }
    // Ensure product ID is valid before adding if not in test mode
    if (!isTestMode() && !isValidObjectId(currentItem.product)) {
        setSnackbar({ open: true, message: '無效的藥品ID，請重新選擇藥品。', severity: 'error' });
        return;
    }
    const newItem = { ...currentItem }; 
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setCurrentItem({ did: '', dname: '', dquantity: '', dtotalCost: '', product: null });
    setTimeout(() => {
      const productInput = document.querySelector('#product-select-input');
      if (productInput) productInput.focus();
    }, 100);
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleEditItem = (index) => {
    setEditingItemIndex(index);
    const itemToEdit = formData.items[index];
    // Ensure product ID is valid if not in test mode
    if (!isTestMode() && itemToEdit.product && !isValidObjectId(itemToEdit.product)){
        setSnackbar({ open: true, message: `項目 ${itemToEdit.dname} 的藥品ID無效，請修正。`, severity: 'error' });
        // Potentially clear the product or handle differently
    }
    setEditingItem({ ...itemToEdit }); 
  };

  const handleSaveEditItem = () => {
    if (!editingItem || !editingItem.product || !editingItem.dname || !editingItem.dquantity || editingItem.dtotalCost === '') {
      setSnackbar({ open: true, message: '請填寫完整的藥品項目資料', severity: 'error' });
      return;
    }
    // Ensure product ID is valid before saving if not in test mode
    if (!isTestMode() && !isValidObjectId(editingItem.product)) {
        setSnackbar({ open: true, message: '無效的藥品ID，請重新選擇藥品。', severity: 'error' });
        return;
    }
    const newItems = [...formData.items];
    newItems[editingItemIndex] = editingItem;
    setFormData(prev => ({ ...prev, items: newItems }));
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
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validations
    if (!formData.poid && !isEditMode) { // poid can be auto-generated for new, but check if user tried to input something invalid
        // For new orders, poid might be empty if auto-generated. Let backend handle this if needed.
        // If it's required from user for new, this check needs adjustment.
    }
    if (!formData.supplier) {
      setSnackbar({ open: true, message: '請選擇一個供應商', severity: 'error' });
      return;
    }
    if (formData.items.length === 0) {
      setSnackbar({ open: true, message: '請至少添加一個藥品項目', severity: 'error' });
      return;
    }

    // Filter out any test/mock data if not in test mode
    // And ensure all IDs are valid ObjectIds
    let itemsForSubmit = formData.items;
    if (!isTestMode()) {
      if (!isValidObjectId(formData.supplier)) {
        setSnackbar({ open: true, message: '供應商ID無效，請重新選擇供應商。', severity: 'error' });
        return;
      }
      itemsForSubmit = formData.items.map(item => {
        if (!isValidObjectId(item.product)) {
          // This should ideally not happen if selection and add/edit logic is correct
          throw new Error(`藥品 ${item.dname || '未知藥品'} 的ID格式不正確。`);
        }
        return {
          product: item.product, // Already ObjectId from selection
          dquantity: parseFloat(item.dquantity),
          dtotalCost: parseFloat(item.dtotalCost),
          // Include other relevant item fields like did, dname if backend expects them
          // but ensure they are not mock values if they are also IDs.
          did: item.did, // Assuming did is a code, not an ObjectId
          dname: item.dname
        };
      }).filter(item => isValidObjectId(item.product)); // Final safety filter

      if (itemsForSubmit.length !== formData.items.length) {
          setSnackbar({ open: true, message: '部分藥品項目因ID無效已被過濾，請檢查。', severity: 'warning' });
          // Optionally, prevent submission or update formData.items to reflect filtered list
          // For now, we proceed with filtered items if any were invalid.
      }
      if (itemsForSubmit.length === 0 && formData.items.length > 0) {
          setSnackbar({ open: true, message: '所有藥品項目ID均無效，無法提交。', severity: 'error' });
          return;
      }
    }

    const submitData = {
      ...formData,
      pobilldate: format(new Date(formData.pobilldate), 'yyyy-MM-dd'),
      supplier: formData.supplier, // Already ObjectId from selection
      items: itemsForSubmit,
      // Remove client-side only fields or ensure backend handles them
      posupplier: undefined, // This is for display only
    };
    // For new orders, poid might be auto-generated by backend, so don't send if empty
    if (!isEditMode && !submitData.poid) {
        delete submitData.poid;
    }

    try {
      if (isEditMode) {
        await updatePurchaseOrder(id, submitData);
        setSnackbar({ open: true, message: '進貨單已成功更新', severity: 'success' });
      } else {
        await addPurchaseOrder(submitData); // Use addPurchaseOrder for new
        setSnackbar({ open: true, message: '進貨單已成功新增', severity: 'success' });
      }
      setTimeout(() => { navigate('/purchase-orders'); }, 1500);

    } catch (err) {
      console.error(isEditMode ? '更新進貨單失敗:' : '新增進貨單失敗:', err);
      setSnackbar({
        open: true,
        message: (isEditMode ? '更新進貨單失敗: ' : '新增進貨單失敗: ') + (err.response?.data?.msg || err.message || '未知錯誤'),
        severity: 'error'
      });
    }
  };

  const handleSnackbarClose = (event, reason) => {
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
          isEditMode={isEditMode} // Pass isEditMode
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
             <ActionButtons // Moved ActionButtons here, or integrate into the form submission logic
              onSave={handleSubmit} // This button will now trigger the form's onSubmit
              onCancel={handleCancel}
              isEditMode={isEditMode}
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