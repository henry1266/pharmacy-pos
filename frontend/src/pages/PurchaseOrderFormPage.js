import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
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
import GenericConfirmDialog from '../components/common/GenericConfirmDialog'; // NEW IMPORT
import ActionButtons from '../components/purchase-order-form/ActionButtons';

// Helper constants for test mode
const MOCK_PRODUCTS_FOR_TEST_MODE = [
  { id: 'mockProd1', _id: 'mockProd1', name: '模擬產品A (測試)', unit: '瓶', purchasePrice: 50, stock: 100, did: 'T001', dname: '模擬產品A (測試)', category: { name: '測試分類' }, supplier: { name: '模擬供應商X' } },
  { id: 'mockProd2', _id: 'mockProd2', name: '模擬產品B (測試)', unit: '盒', purchasePrice: 120, stock: 50, did: 'T002', dname: '模擬產品B (測試)', category: { name: '測試分類' }, supplier: { name: '模擬供應商Y' } },
  { id: 'mockProd3', _id: 'mockProd3', name: '模擬產品C (測試)', unit: '支', purchasePrice: 75, stock: 200, did: 'T003', dname: '模擬產品C (測試)', category: { name: '測試分類' }, supplier: { name: '模擬供應商X' } },
];
const MOCK_SUPPLIERS_FOR_TEST_MODE = [
  { id: 'mockSup1', _id: 'mockSup1', name: '模擬供應商X (測試)' },
  { id: 'mockSup2', _id: 'mockSup2', name: '模擬供應商Y (測試)' },
];

// Helper function to adjust purchase order items with multiplier and rounding
const adjustPurchaseOrderItems = (items, multiplier) => {
  if (!items || items.length === 0) {
    return [];
  }

  let adjustedItems = items.map(item => ({
    ...item,
    dtotalCost: parseFloat((Number(item.dtotalCost || 0) * multiplier).toFixed(2))
  }));

  const rawTotalAmountBeforeMultiplier = items.reduce((sum, item) => sum + Number(item.dtotalCost || 0), 0);
  const totalAmountAfterMultiplier = rawTotalAmountBeforeMultiplier * multiplier;
  const roundedTotalAmount = Math.round(totalAmountAfterMultiplier);
  const roundingDifference = roundedTotalAmount - totalAmountAfterMultiplier;

  if (roundingDifference !== 0 && adjustedItems.length > 0) {
    const maxCostItemIndex = adjustedItems.reduce((maxIndex, item, currentIndex, arr) => {
      return Number(item.dtotalCost) > Number(arr[maxIndex].dtotalCost) ? currentIndex : maxIndex;
    }, 0);

    adjustedItems = adjustedItems.map((item, index) => {
      if (index === maxCostItemIndex) {
        return {
          ...item,
          dtotalCost: parseFloat((Number(item.dtotalCost) + roundingDifference).toFixed(2))
        };
      }
      return item;
    });
  }
  return adjustedItems;
};

// Helper component/function to render initial loading or error states
const RenderInitialState = ({
  dataLoading,
  orderDataLoaded,
  isGlobalTestMode,
  dataError,
  isEditMode,
  orderData,
  products, // state variable
  suppliers // state variable
}) => {
  if (dataLoading && !orderDataLoaded && !isGlobalTestMode) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 1 }}>載入中...</Typography>
      </Box>
    );
  }

  if (dataError && (!orderData && !isEditMode) && !isGlobalTestMode) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">
          {typeof dataError === 'string' ? dataError : JSON.stringify(dataError)}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
          重試
        </Button>
      </Box>
    );
  }

  if (isGlobalTestMode && dataError && !(products && products.length > 0 && suppliers && suppliers.length > 0)) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="warning">
          測試模式：無法載入初始資料，也無法載入模擬資料。請檢查控制台。
        </Typography>
      </Box>
    );
  }
  return null;
};

RenderInitialState.propTypes = {
  dataLoading: PropTypes.bool.isRequired,
  orderDataLoaded: PropTypes.bool.isRequired,
  isGlobalTestMode: PropTypes.bool.isRequired,
  dataError: PropTypes.any,
  isEditMode: PropTypes.bool.isRequired,
  orderData: PropTypes.object,
  products: PropTypes.array,
  suppliers: PropTypes.array,
};

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

  // Destructure with 'let' to allow reassignment for test mode
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
    // fetchProductDetailsForItems // This is a function from the hook, not directly modified here
  } = usePurchaseOrderData(isEditMode, id, showSnackbar);

  // Create mutable versions of data for test mode modification
  let dataLoading = initialDataLoading;
  let dataError = initialDataError;
  let suppliers = initialSuppliers;
  let products = initialProducts;
  let productDetailsLoading = initialProductDetailsLoading;
  let suppliersLoaded = initialSuppliersLoaded;
  let productsLoaded = initialProductsLoaded;

  if (isGlobalTestMode) {
    const currentMockProducts = MOCK_PRODUCTS_FOR_TEST_MODE;
    const currentMockSuppliers = MOCK_SUPPLIERS_FOR_TEST_MODE;

    if (!products || products.length === 0 || (dataError && !productsLoaded)) {
      products = currentMockProducts;
      productsLoaded = true;
    }
    if (!suppliers || suppliers.length === 0 || (dataError && !suppliersLoaded)) {
      suppliers = currentMockSuppliers;
      suppliersLoaded = true;
    }
    // If there was an error but we have mock data, clear the error and loading state
    if (dataError && (products === currentMockProducts || suppliers === currentMockSuppliers)) {
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
    posupplier: '', // supplier name
    supplier: '', // Store supplier ID
    items: [],
    notes: '',
    status: 'pending',
    paymentStatus: '未付',
    multiplierMode: '' // 倍率模式欄位
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
  } = usePurchaseOrderItems({
    initialItems: formData.items,
    productsData: products,
    showSnackbar,
    productInputRef,
    formData,
    setFormData,
    productDetails,
    setProductDetails
  });

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
        items: orderData.items || []
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
    let timerId;
    if (!dataLoading) {
        if (!isEditMode) {
            if (invoiceInputRef.current) {
                timerId = setTimeout(() => {
                  if (invoiceInputRef.current) {
                    invoiceInputRef.current.focus();
                  }
                }, 500); 
            }
        } else if (orderDataLoaded) {
            if (productInputRef.current) {
                timerId = setTimeout(() => {
                  if (productInputRef.current) {
                    productInputRef.current.focus();
                  }
                }, 500);
            }
        }
    }
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
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

    const multiplier = getMultiplier();
    const finalAdjustedItems = adjustPurchaseOrderItems(formData.items, multiplier);

    const submitData = {
      ...formData,
      pobilldate: format(formData.pobilldate, 'yyyy-MM-dd'),
      items: finalAdjustedItems.map(item => ({
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

  // 計算倍率係數
  const getMultiplier = () => {
    const multiplierValue = parseFloat(formData.multiplierMode);
    if (!multiplierValue || isNaN(multiplierValue)) {
      return 1; // 無倍率或無效值時返回1（不調整）
    }
    return 1 + (multiplierValue / 100); // 轉換為倍率係數
  };

  // 計算總金額（含倍率調整） for display
  const rawTotalAmountForDisplay = formData.items.reduce((sum, item) => sum + Number(item.dtotalCost || 0), 0);
  const currentMultiplierForDisplay = getMultiplier();
  const adjustedTotalAmountForDisplay = rawTotalAmountForDisplay * currentMultiplierForDisplay;
  const totalAmountForDisplay = Math.round(adjustedTotalAmountForDisplay);
  
  // 對話框標題獲取函數
  const getDialogTitle = () => {
    if (isGlobalTestMode) {
      return "測試模式確認";
    }
    return formData.status === 'completed' ? "確認完成進貨單" : "確認提交";
  };

  // 對話框訊息獲取函數
  const getDialogMessage = () => {
    if (isGlobalTestMode) {
      return "此為測試模式，操作不會實際儲存。是否繼續？";
    }
    return formData.status === 'completed' 
      ? "您確定要將此進貨單標記為完成嗎？完成後將無法修改。" 
      : "您確定要提交此進貨單嗎？";
  };

  const initialStateRender = RenderInitialState({
    dataLoading,
    orderDataLoaded,
    isGlobalTestMode,
    dataError,
    isEditMode,
    orderData,
    products,
    suppliers,
  });

  if (initialStateRender) {
    return initialStateRender;
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
                totalAmount={totalAmountForDisplay} 
                productDetails={productDetails}
                productDetailsLoading={productDetailsLoading && !isGlobalTestMode}
                codeField="did"
                showHealthInsuranceCode={true}
                isTestMode={isGlobalTestMode}
              />
            </Box>
          </CardContent>
        </Card>

        <GenericConfirmDialog
          open={confirmDialogOpen}
          onClose={handleCancelComplete}
          onConfirm={handleConfirmComplete}
          title={getDialogTitle()}
          message={getDialogMessage()}
          confirmText="確認"
          cancelText="取消"
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
