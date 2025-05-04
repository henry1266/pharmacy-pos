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
    status: 'pending',
    paymentStatus: '未付'
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
  }, [id]);

  // useEffect for setting selected supplier based on loaded data
  useEffect(() => {
    if (orderDataLoaded && suppliersLoaded && formData.supplier) {
      console.log('Attempting to find supplier for ID:', formData.supplier);
      // Find supplier using 'id' field from supplierService response
      const supplier = suppliers.find(s => s.id === formData.supplier || s._id === formData.supplier);
      if (supplier) {
        console.log('找到匹配的供應商:', supplier);
        setSelectedSupplier(supplier);
        // Ensure posupplier (name) is consistent if it wasn't set correctly initially
        if (formData.posupplier !== supplier.name) {
             setFormData(prev => ({ ...prev, posupplier: supplier.name }));
        }
      } else {
        console.log('未找到匹配的供應商 for ID:', formData.supplier);
        setSelectedSupplier(null);
        // Optionally clear invalid supplier data from form
        // setFormData(prev => ({ ...prev, posupplier: '', supplier: '' }));
      }
    } else if (!formData.supplier) {
        // Clear selection if formData.supplier is empty
        setSelectedSupplier(null);
    }
  }, [orderDataLoaded, suppliersLoaded, formData.supplier, suppliers]);

  // Input change handlers
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, pobilldate: date });
  };

  // Supplier change handler (uses 'id' from supplierService)
  const handleSupplierChange = (event, newValue) => {
    if (newValue) {
      setSelectedSupplier(newValue);
      setFormData({ ...formData, posupplier: newValue.name, supplier: newValue.id });
    } else {
      setSelectedSupplier(null);
      setFormData({ ...formData, posupplier: '', supplier: '' });
    }
  };

  // Item input change handlers
  const handleItemInputChange = (e) => {
    setCurrentItem({ ...currentItem, [e.target.name]: e.target.value });
  };

  const handleEditingItemChange = (e) => {
    setEditingItem({ ...editingItem, [e.target.name]: e.target.value });
  };

  // Product change handler (uses '_id' from productService)
  const handleProductChange = (event, newValue) => {
    if (newValue) {
      setCurrentItem({
        ...currentItem,
        did: newValue.code, // Assuming 'code' is the identifier shown/used in items
        dname: newValue.name,
        product: newValue._id // Store the actual product ID
      });
    } else {
      setCurrentItem({ ...currentItem, did: '', dname: '', product: null });
    }
  };

  // Add/Remove/Edit/Move item handlers (logic remains the same)
  const handleAddItem = () => {
    if (!currentItem.did || !currentItem.dname || !currentItem.dquantity || currentItem.dtotalCost === '') {
      setSnackbar({ open: true, message: '請填寫完整的藥品項目資料', severity: 'error' });
      return;
    }
    // Ensure the item being added has the product ID
    const newItem = { ...currentItem, product: currentItem.product }; 
    setFormData({ ...formData, items: [...formData.items, newItem] });
    setCurrentItem({ did: '', dname: '', dquantity: '', dtotalCost: '', product: null });
    // Refocus logic remains
    setTimeout(() => {
      const productInput = document.querySelector('#product-select-input'); // Use querySelector for robustness
      if (productInput) productInput.focus();
    }, 100);
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleEditItem = (index) => {
    setEditingItemIndex(index);
    // Ensure we are editing a copy, not the original item in state
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

  const handleMoveItem = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === formData.items.length - 1)) return;
    const newItems = [...formData.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setFormData({ ...formData, items: newItems });
  };

  // Refactored submit handler using service
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.poid || !formData.posupplier || !formData.supplier) {
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
        pobilldate: format(formData.pobilldate, 'yyyy-MM-dd'),
        // Ensure items being submitted contain the product ID
        items: formData.items.map(item => ({ 
            ...item, 
            product: item.product // Ensure product ID is included
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

  // Snackbar close and cancel handlers
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCancel = () => {
    navigate('/purchase-orders');
  };

  // Calculate total amount
  const totalAmount = formData.items.reduce((sum, item) => sum + Number(item.dtotalCost || 0), 0);

  // Loading and error states rendering
  if (loading) {
    return <Box sx={{ p: 3, textAlign: 'center' }}><Typography>載入中...</Typography></Box>;
  }
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" onClick={() => navigate('/purchase-orders')} sx={{ mt: 2 }}>
          返回進貨單列表
        </Button>
      </Box>
    );
  }

  // Main component rendering
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
          suppliers={suppliers} // Pass suppliers list
          selectedSupplier={selectedSupplier} // Pass selected supplier object
          isEditMode={true}
        />

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>藥品項目</Typography>
            <ActionButtons
              loading={loading} // Pass loading state if needed
              onSave={handleSubmit} // Use handleSubmit directly
              onCancel={handleCancel}
            />
            <ProductItemForm
              currentItem={currentItem}
              handleItemInputChange={handleItemInputChange}
              handleProductChange={handleProductChange}
              handleAddItem={handleAddItem}
              products={products} // Pass products list
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

