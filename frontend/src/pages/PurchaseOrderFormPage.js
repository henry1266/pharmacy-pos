import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Button,
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';

import { addPurchaseOrder, updatePurchaseOrder } from '../services/purchaseOrdersService';
import usePurchaseOrderData from '../hooks/usePurchaseOrderData';
import usePurchaseOrderItems from '../hooks/usePurchaseOrderItems';

import BasicInfoForm from '../components/purchase-order-form/BasicInfoForm';
import ProductItemForm from '../components/purchase-order-form/ProductItemForm';
import ProductItemsTable from '../components/purchase-order-form/ProductItemsTable';
import ConfirmDialog from '../components/purchase-order-form/ConfirmDialog';
import ActionButtons from '../components/purchase-order-form/ActionButtons';

const PurchaseOrderFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const isGlobalTestMode = useMemo(() => {
    try {
      return localStorage.getItem('token') === 'test-mode-token';
    } catch (e) {
      console.error('Failed to access localStorage:', e);
      return false;
    }
  }, []);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showSnackbar = useCallback((message, severity) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  let {
    loading: initialDataLoading,
    error: initialDataError,
    suppliers: initialSuppliers,
    products: initialProducts,
    productDetails,
    setProductDetails,
    productDetailsLoading: initialProductDetailsLoading,
    orderData,
    orderDataLoaded,
    suppliersLoaded: initialSuppliersLoaded,
    productsLoaded: initialProductsLoaded,
  } = usePurchaseOrderData(isEditMode, id, showSnackbar);

  let dataLoading = initialDataLoading;
  let dataError = initialDataError;
  let suppliers = initialSuppliers;
  let products = initialProducts;
  let productDetailsLoading = initialProductDetailsLoading;
  let suppliersLoaded = initialSuppliersLoaded;
  let productsLoaded = initialProductsLoaded;

  if (isGlobalTestMode) {
    const mockProducts = [
      { id: 'mockProd1', _id: 'mockProd1', name: '模擬產品A (測試)', unit: '瓶', purchasePrice: 50, stock: 100, did: 'T001', dname: '模擬產品A (測試)', category: { name: '測試分類' }, supplier: { name: '模擬供應商X' } },
      { id: 'mockProd2', _id: 'mockProd2', name: '模擬產品B (測試)', unit: '盒', purchasePrice: 120, stock: 50, did: 'T002', dname: '模擬產品B (測試)', category: { name: '測試分類' }, supplier: { name: '模擬供應商Y' } },
      { id: 'mockProd3', _id: 'mockProd3', name: '模擬產品C (測試)', unit: '支', purchasePrice: 75, stock: 200, did: 'T003', dname: '模擬產品C (測試)', category: { name: '測試分類' }, supplier: { name: '模擬供應商X' } },
    ];
    const mockSuppliers = [
      { id: 'mockSup1', _id: 'mockSup1', name: '模擬供應商X (測試)' },
      { id: 'mockSup2', _id: 'mockSup2', name: '模擬供應商Y (測試)' },
    ];

    if (!products || products.length === 0 || (dataError && !productsLoaded)) {
      products = mockProducts;
      productsLoaded = true;
    }
    if (!suppliers || suppliers.length === 0 || (dataError && !suppliersLoaded)) {
      suppliers = mockSuppliers;
      suppliersLoaded = true;
    }
    if (dataError && (products === mockProducts || suppliers === mockSuppliers)) {
      dataError = null;
    }
    if (dataLoading && (productsLoaded || suppliersLoaded)) {
        dataLoading = false;
    }
  }

  const [formData, setFormData] = useState({
    poid: '',
    pobill: '',
    pobilldate: new Date(),
    posupplier: '', 
    supplier: '', 
    items: [],
    notes: '',
    status: '處理中', // Default to '處理中' as per updated backend model
    paymentStatus: '未付款'
  });

  const productInputRef = useRef(null);
  const invoiceInputRef = useRef(null);

  const {
    currentItem,
    editingItemIndex,
    editingItem,
    handleItemInputChange,
    handleEditingItemChange,
    handleProductChange,
    handleAddItem,
    handleRemoveItem,
    handleEditItem,
    handleSaveEditItem,
    handleCancelEditItem,
    handleMoveItem,
  } = usePurchaseOrderItems(formData.items, products, showSnackbar, productInputRef, formData, setFormData, productDetails, setProductDetails);

  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    if (isEditMode && orderData) {
      const supplierId = typeof orderData.supplier === 'object' ? orderData.supplier._id : orderData.supplier;
      setFormData({
        ...orderData,
        pobilldate: orderData.pobilldate ? new Date(orderData.pobilldate) : new Date(),
        supplier: supplierId,
        items: orderData.items || [],
        status: orderData.status || '處理中',
        paymentStatus: orderData.paymentStatus || '未付款'
      });
    }
  }, [isEditMode, orderData]);

  useEffect(() => {
    if (isEditMode && orderDataLoaded && suppliersLoaded && formData.supplier && suppliers && suppliers.length > 0) {
      const supplierObj = suppliers.find(s => s.id === formData.supplier || s._id === formData.supplier);
      if (supplierObj) {
        setSelectedSupplier(supplierObj);
        if (formData.posupplier !== supplierObj.name) {
          setFormData(prev => ({ ...prev, posupplier: supplierObj.name }));
        }
      }
    }
  }, [isEditMode, orderDataLoaded, suppliersLoaded, formData.supplier, formData.posupplier, suppliers]);

  useEffect(() => {
    if (!dataLoading) {
        if (!isEditMode) {
            if (invoiceInputRef.current) {
                setTimeout(() => invoiceInputRef.current.focus(), 500); 
            }
        } else if (orderDataLoaded) {
            if (productInputRef.current) {
                setTimeout(() => productInputRef.current.focus(), 500);
            }
        }
    }
  }, [dataLoading, isEditMode, orderDataLoaded]);

  const handleFormInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, pobilldate: date });
  };

  const handleSupplierChange = (event, newValue) => {
    if (newValue) {
      setSelectedSupplier(newValue);
      setFormData({ ...formData, posupplier: newValue.name, supplier: newValue.id || newValue._id });
    } else {
      setSelectedSupplier(null);
      setFormData({ ...formData, posupplier: '', supplier: '' });
    }
  };

  // Handler for PaymentStatusSelect change
  const handlePaymentStatusChangeInternal = async (event, newValue) => {
    const originalPaymentStatus = formData.paymentStatus;
    setFormData(prevFormData => ({
      ...prevFormData,
      paymentStatus: newValue
    }));

    if (isEditMode && id && !isGlobalTestMode) {
      try {
        await updatePurchaseOrder(id, { paymentStatus: newValue });
        showSnackbar('付款狀態已更新', 'success');
      } catch (err) {
        console.error('更新付款狀態失敗:', err);
        showSnackbar('更新付款狀態失敗: ' + (err.response?.data?.msg || err.message), 'error');
        setFormData(prevFormData => ({ // Revert on failure
          ...prevFormData,
          paymentStatus: originalPaymentStatus 
        }));
      }
    }
  };

  // Handler for StatusSelect change
  const handleStatusChangeInternal = async (event, newValue) => {
    // If StatusSelect is a simple Select, newValue might be event.target.value
    // Assuming StatusSelect's onChange provides newValue directly or as second arg like Autocomplete
    const actualNewValue = typeof newValue === 'string' ? newValue : event.target.value; 
    const originalStatus = formData.status;

    setFormData(prevFormData => ({
      ...prevFormData,
      status: actualNewValue
    }));

    if (isEditMode && id && !isGlobalTestMode) {
      try {
        await updatePurchaseOrder(id, { status: actualNewValue });
        showSnackbar('狀態已更新', 'success');
      } catch (err) {
        console.error('更新狀態失敗:', err);
        showSnackbar('更新狀態失敗: ' + (err.response?.data?.msg || err.message), 'error');
        setFormData(prevFormData => ({ // Revert on failure
          ...prevFormData,
          status: originalStatus
        }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.posupplier || !formData.supplier) {
      showSnackbar('請填寫所有必填欄位 (供應商)', 'error');
      return;
    }
    if (formData.items.length === 0) {
      showSnackbar('請至少添加一個藥品項目', 'error');
      return;
    }
    if (formData.status === 'completed' && !isGlobalTestMode) {
      setConfirmDialogOpen(true);
      return;
    }
    submitForm();
  };

  const submitForm = async () => {
    setFormSubmitLoading(true);

    if (isGlobalTestMode) {
      console.log('TEST MODE: Simulating form submission with data:', formData);
      showSnackbar(`進貨單已在測試模式下模擬${isEditMode ? '更新' : '新增'}成功`, 'success');
      setTimeout(() => { navigate('/purchase-orders'); }, 1500);
      setFormSubmitLoading(false);
      setConfirmDialogOpen(false);
      return;
    }

    const submitData = {
      ...formData,
      pobilldate: format(formData.pobilldate, 'yyyy-MM-dd'),
      items: formData.items.map(item => ({
        did: item.did,
        dname: item.dname,
        dquantity: item.dquantity,
        dtotalCost: item.dtotalCost,
        product: item.product
      }))
    };

    try {
      if (isEditMode) {
        await updatePurchaseOrder(id, submitData);
        showSnackbar('進貨單已成功更新', 'success');
      } else {
        await addPurchaseOrder(submitData);
        showSnackbar('進貨單已成功新增', 'success');
      }
      setTimeout(() => { navigate('/purchase-orders'); }, 1500);
    } catch (err) {
      console.error('提交進貨單失敗:', err);
      showSnackbar('提交進貨單失敗: ' + (err.response?.data?.msg || err.message), 'error');
    } finally {
      setFormSubmitLoading(false);
      setConfirmDialogOpen(false);
    }
  };

  const handleConfirmComplete = () => {
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

  if (dataLoading && !orderDataLoaded && !isGlobalTestMode) {
    return <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress /><Typography sx={{mt:1}}>載入中...</Typography></Box>;
  }

  if (dataError && (!orderData && !isEditMode) && !isGlobalTestMode) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{typeof dataError === 'string' ? dataError : JSON.stringify(dataError)}</Typography>
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
          重試
        </Button>
      </Box>
    );
  }
  
  if (isGlobalTestMode && dataError && !(products && products.length > 0 && suppliers && suppliers.length > 0)) {
     return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="warning">測試模式：無法載入初始資料，也無法載入模擬資料。請檢查控制台。</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h5" component="h1" gutterBottom>
        {isEditMode ? '編輯進貨單' : '新增進貨單'}
        {isGlobalTestMode && <Typography variant="caption" color="secondary" sx={{ ml: 1 }}>(測試模式)</Typography>}
      </Typography>

      <form onSubmit={handleSubmit}>
        <BasicInfoForm
          formData={formData}
          handleInputChange={handleFormInputChange}
          handleDateChange={handleDateChange}
          handleSupplierChange={handleSupplierChange}
          suppliers={suppliers || []}
          selectedSupplier={selectedSupplier}
          isEditMode={isEditMode}
          loading={dataLoading && !suppliersLoaded && !isGlobalTestMode}
          invoiceInputRef={invoiceInputRef}
          isTestMode={isGlobalTestMode}
          // Pass down the new handlers and current values
          handlePaymentStatusChange={handlePaymentStatusChangeInternal}
          selectedPaymentStatus={formData.paymentStatus}
          handleStatusChange={handleStatusChangeInternal}
          selectedStatus={formData.status}
        />

        <Card sx={{ mb: 1 }}>
          <CardContent sx={{ pb: 1 }}>
            <Typography variant="h6">藥品項目</Typography>
            <Box>
              <ActionButtons
                loading={formSubmitLoading} 
                onCancel={handleCancel}
                isTestMode={isGlobalTestMode}
              />
            </Box>
            <Box sx={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10, pb: 1, borderBottom: '1px solid #e0e0e0' }}>
              <ProductItemForm
                currentItem={currentItem}
                handleItemInputChange={handleItemInputChange}
                handleProductChange={handleProductChange}
                handleAddItem={handleAddItem}
                products={products || []}
                loading={dataLoading && !productsLoaded && !isGlobalTestMode}
                productInputRef={productInputRef}
                isTestMode={isGlobalTestMode}
              />
            </Box>
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
                productDetails={productDetails} 
                productDetailsLoading={productDetailsLoading && !isGlobalTestMode}
                codeField="did"
                showHealthInsuranceCode={true}
                isTestMode={isGlobalTestMode}
              />
            </Box>
          </CardContent>
        </Card>

        <ConfirmDialog
          open={confirmDialogOpen}
          onClose={handleCancelComplete}
          onConfirm={handleConfirmComplete}
          title={isGlobalTestMode ? "測試模式確認" : (formData.status === 'completed' ? "確認完成進貨單" : "確認提交")}
          message={isGlobalTestMode ? "此為測試模式，操作不會實際儲存。是否繼續？" : (formData.status === 'completed' ? "您確定要將此進貨單標記為完成嗎？完成後將無法修改。" : "您確定要提交此進貨單嗎？")}
        />
      </form>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseOrderFormPage;

