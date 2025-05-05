import React, { useState, useEffect } from 'react';
// Removed Redux imports: useDispatch, useSelector
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

// Import service functions instead of Redux actions
import { getPurchaseOrderById, addPurchaseOrder, updatePurchaseOrder } from '../services/purchaseOrdersService';
import { getSuppliers } from '../services/supplierService';
import { getProducts, getProductByCode } from '../services/productService'; // Added getProductByCode

// Import components (remain the same)
import BasicInfoForm from '../components/purchase-order-form/BasicInfoForm';
import ProductItemForm from '../components/purchase-order-form/ProductItemForm';
import ProductItemsTable from '../components/purchase-order-form/ProductItemsTable';
import ConfirmDialog from '../components/purchase-order-form/ConfirmDialog';
import ActionButtons from '../components/purchase-order-form/ActionButtons';

const PurchaseOrderFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // Local state management instead of Redux selectors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productDetails, setProductDetails] = useState({}); // State for product details (healthInsuranceCode)
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);

  const [formData, setFormData] = useState({
    poid: '',
    pobill: '',
    pobilldate: new Date(),
    posupplier: '',
    supplier: '', // Store supplier ID
    items: [],
    notes: '',
    status: 'pending',
    paymentStatus: '未付'
  });

  const [currentItem, setCurrentItem] = useState({
    did: '', // This is the product code (健保代碼 or 自定義碼)
    dname: '',
    dquantity: '',
    dtotalCost: '',
    product: null // Store the actual product ID (_id)
  });

  const [editingItemIndex, setEditingItemIndex] = useState(-1);
  const [editingItem, setEditingItem] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [orderDataLoaded, setOrderDataLoaded] = useState(!isEditMode); // True if adding
  const [suppliersLoaded, setSuppliersLoaded] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);

  // --- Refactored Data Fetching using Services ---
  const fetchSuppliersData = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
      setSuppliersLoaded(true);
    } catch (err) {
      setError('獲取供應商數據失敗');
      setSnackbar({ open: true, message: '獲取供應商數據失敗: ' + (err.response?.data?.msg || err.message), severity: 'error' });
      throw err;
    }
  };

  const fetchProductsData = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
      setProductsLoaded(true);
    } catch (err) {
      setError('獲取產品數據失敗');
      setSnackbar({ open: true, message: '獲取產品數據失敗: ' + (err.response?.data?.msg || err.message), severity: 'error' });
      throw err;
    }
  };

  const fetchPurchaseOrderData = async (orderId) => {
    try {
      const data = await getPurchaseOrderById(orderId);
      const supplierId = typeof data.supplier === 'object' ? data.supplier._id : data.supplier;
      setFormData({
        ...data,
        pobilldate: data.pobilldate ? new Date(data.pobilldate) : new Date(),
        supplier: supplierId
      });
      setOrderDataLoaded(true);
      return data; // Return data for subsequent product detail fetching
    } catch (err) {
      setError('獲取進貨單數據失敗');
      setSnackbar({ open: true, message: '獲取進貨單數據失敗: ' + (err.response?.data?.msg || err.message), severity: 'error' });
      throw err;
    }
  };

  // Fetch product details (including healthInsuranceCode) for items
  const fetchProductDetailsForItems = async (items) => {
    if (!items || items.length === 0) {
      setProductDetails({});
      return;
    }
    setProductDetailsLoading(true);
    try {
      const detailsMap = {};
      const promises = items.map(item =>
        getProductByCode(item.did) // Use getProductByCode with the item's code (did)
          .then(productData => {
            if (productData) {
              detailsMap[item.did] = productData; // Store details keyed by product code (did)
            }
          })
          .catch(err => {
            console.error(`獲取產品 ${item.did} 詳細資料失敗:`, err);
            // Optionally set a specific error state for this item
          })
      );
      await Promise.all(promises);
      setProductDetails(detailsMap);
    } catch (err) {
      console.error('批次獲取產品詳細資料失敗:', err);
      setSnackbar({ open: true, message: '獲取部分藥品詳細資料失敗', severity: 'warning' });
    } finally {
      setProductDetailsLoading(false);
    }
  };

  // Initial data loading useEffect
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchPromises = [fetchSuppliersData(), fetchProductsData()];
        if (isEditMode && id) {
          fetchPromises.push(fetchPurchaseOrderData(id));
        }
        const results = await Promise.all(fetchPromises);

        // If editing, fetch product details after order data is loaded
        if (isEditMode && results[2] && results[2].items) {
          await fetchProductDetailsForItems(results[2].items);
        }

        // Set focus after loading
        if (!isEditMode) {
          setTimeout(() => {
            const invoiceInput = document.querySelector('input[name="pobill"]');
            if (invoiceInput) invoiceInput.focus();
          }, 500);
        } else {
          setTimeout(() => {
            const productInput = document.getElementById('product-select-input');
            if (productInput) productInput.focus();
          }, 500);
        }

      } catch (err) {
        // Error state is set within individual fetch functions
        console.error('加載初始數據時出錯:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [isEditMode, id]); // Removed dispatch

  // Effect to set selected supplier when data loads in edit mode
  useEffect(() => {
    if (isEditMode && orderDataLoaded && suppliersLoaded && formData.supplier) {
      const supplier = suppliers.find(s => s.id === formData.supplier || s._id === formData.supplier);
      if (supplier) {
        setSelectedSupplier(supplier);
        // Ensure name consistency
        if (formData.posupplier !== supplier.name) {
          setFormData(prev => ({ ...prev, posupplier: supplier.name }));
        }
      } else {
        setSelectedSupplier(null);
      }
    }
  }, [isEditMode, orderDataLoaded, suppliersLoaded, formData.supplier, suppliers]);

  // --- Input Handlers (mostly remain the same) ---
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, pobilldate: date });
  };

  const handleSupplierChange = (event, newValue) => {
    if (newValue) {
      setSelectedSupplier(newValue);
      setFormData({ ...formData, posupplier: newValue.name, supplier: newValue.id }); // Use 'id' from service
    } else {
      setSelectedSupplier(null);
      setFormData({ ...formData, posupplier: '', supplier: '' });
    }
  };

  const handleItemInputChange = (e) => {
    setCurrentItem({ ...currentItem, [e.target.name]: e.target.value });
  };

  const handleEditingItemChange = (e) => {
    setEditingItem({ ...editingItem, [e.target.name]: e.target.value });
  };

  const handleProductChange = (event, newValue) => {
    if (newValue) {
      setCurrentItem({
        ...currentItem,
        did: newValue.code, // Use product code for 'did'
        dname: newValue.name,
        product: newValue._id // Store actual product ID
      });
    } else {
      setCurrentItem({ ...currentItem, did: '', dname: '', product: null });
    }
  };

  // --- Item Management Handlers ---
  const handleAddItem = async () => { // Make async to fetch details
    if (!currentItem.did || !currentItem.dname || !currentItem.dquantity || currentItem.dtotalCost === '') {
      setSnackbar({ open: true, message: '請填寫完整的藥品項目資料', severity: 'error' });
      return;
    }
    const newItem = { ...currentItem };
    const newItems = [...formData.items, newItem];
    setFormData({ ...formData, items: newItems });

    // Fetch details for the newly added item if not already fetched
    if (!productDetails[newItem.did]) {
      try {
        const detail = await getProductByCode(newItem.did);
        if (detail) {
          setProductDetails(prev => ({ ...prev, [newItem.did]: detail }));
        }
      } catch (err) {
        console.error(`獲取產品 ${newItem.did} 詳細資料失敗:`, err);
        setSnackbar({ open: true, message: `無法獲取 ${newItem.dname} 的詳細資料`, severity: 'warning' });
      }
    }

    setCurrentItem({ did: '', dname: '', dquantity: '', dtotalCost: '', product: null });
    setTimeout(() => {
      const productInput = document.getElementById('product-select-input');
      if (productInput) productInput.focus();
    }, 100);
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
    // Note: Product details for removed items remain in productDetails state, which is fine.
  };

  const handleEditItem = (index) => {
    setEditingItemIndex(index);
    setEditingItem({ ...formData.items[index] });
  };

  const handleSaveEditItem = async () => { // Make async to fetch details if code changes
    if (!editingItem || !editingItem.did || !editingItem.dname || !editingItem.dquantity || editingItem.dtotalCost === '') {
      setSnackbar({ open: true, message: '請填寫完整的藥品項目資料', severity: 'error' });
      return;
    }
    const originalItem = formData.items[editingItemIndex];
    const newItems = [...formData.items];
    newItems[editingItemIndex] = editingItem;
    setFormData({ ...formData, items: newItems });

    // If product code (did) changed, fetch new details
    if (originalItem.did !== editingItem.did && !productDetails[editingItem.did]) {
       try {
        const detail = await getProductByCode(editingItem.did);
        if (detail) {
          setProductDetails(prev => ({ ...prev, [editingItem.did]: detail }));
        }
      } catch (err) {
        console.error(`獲取產品 ${editingItem.did} 詳細資料失敗:`, err);
        setSnackbar({ open: true, message: `無法獲取 ${editingItem.dname} 的詳細資料`, severity: 'warning' });
      }
    }

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

  // --- Refactored Submission Logic ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.posupplier || !formData.supplier) { // Check for supplier ID as well
      setSnackbar({ open: true, message: '請填寫所有必填欄位 (供應商)', severity: 'error' });
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

  const submitForm = async () => {
    setLoading(true); // Indicate submission start
    setError(null);
    const submitData = {
      ...formData,
      pobilldate: format(formData.pobilldate, 'yyyy-MM-dd'),
      // Ensure items have the product ID (_id)
      items: formData.items.map(item => ({
        did: item.did,
        dname: item.dname,
        dquantity: item.dquantity,
        dtotalCost: item.dtotalCost,
        product: item.product // Ensure product ID is included
      }))
    };

    try {
      if (isEditMode) {
        await updatePurchaseOrder(id, submitData);
        setSnackbar({ open: true, message: '進貨單已成功更新', severity: 'success' });
      } else {
        await addPurchaseOrder(submitData);
        setSnackbar({ open: true, message: '進貨單已成功新增', severity: 'success' });
      }
      setTimeout(() => { navigate('/purchase-orders'); }, 1500);
    } catch (err) {
      console.error('提交進貨單失敗:', err);
      setError('提交進貨單失敗');
      setSnackbar({ open: true, message: '提交進貨單失敗: ' + (err.response?.data?.msg || err.message), severity: 'error' });
    } finally {
      setLoading(false); // Indicate submission end
      setConfirmDialogOpen(false); // Close dialog if it was open
    }
  };

  const handleConfirmComplete = () => {
    // submitForm handles closing the dialog and setting loading state
    submitForm();
  };

  const handleCancelComplete = () => {
    setConfirmDialogOpen(false);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCancel = () => {
    navigate('/purchase-orders');
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + Number(item.dtotalCost || 0), 0);

  // --- Rendering Logic (minor adjustments for local state) ---
  if (loading && !formData.poid) { // Show loading only on initial load
     return <Box sx={{ p: 3, textAlign: 'center' }}><Typography>載入中...</Typography></Box>;
  }
  // Display error if initial load failed
  if (error && !formData.poid && !isEditMode) {
     return (
       <Box sx={{ p: 3, textAlign: 'center' }}>
         <Typography color="error">{error}</Typography>
         <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
           重試
         </Button>
       </Box>
     );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}> {/* Added responsive padding */} 
      <Typography variant="h5" component="h1" gutterBottom>
        {isEditMode ? '編輯進貨單' : '新增進貨單'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <BasicInfoForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleDateChange={handleDateChange}
          handleSupplierChange={handleSupplierChange}
          suppliers={suppliers}
          selectedSupplier={selectedSupplier}
          isEditMode={isEditMode}
          loading={loading && !suppliersLoaded} // Pass loading state for supplier dropdown
        />

        <Card sx={{ mb: 1 }}>
          <CardContent sx={{ pb: 1 }}>
            <Typography variant="h6">
              藥品項目
            </Typography>

            <Box>
              <ActionButtons
                loading={loading && formData.poid === ''} // Pass loading state, disable if submitting
                onCancel={handleCancel}
                // onSave is handled by form onSubmit
              />
            </Box>

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
                loading={loading && !productsLoaded} // Pass loading state for product dropdown
              />
            </Box>

            {/* Adjusted height calculation might be needed based on actual layout */}
            <Box sx={{ height: 'calc(100vh - 550px)', minHeight: '250px', overflowY: 'auto' }}>
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
                productDetails={productDetails} // Pass product details
                productDetailsLoading={productDetailsLoading} // Pass loading state for details
                codeField="did" // Specify that 'did' is the code field
                showHealthInsuranceCode={true} // Explicitly show health insurance code
              />
            </Box>
          </CardContent>
        </Card>

        <ConfirmDialog
          open={confirmDialogOpen}
          onClose={handleCancelComplete}
          onConfirm={handleConfirmComplete}
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

export default PurchaseOrderFormPage;

