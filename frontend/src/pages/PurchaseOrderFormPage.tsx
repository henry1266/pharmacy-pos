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
import { Product, PurchaseOrder } from '@pharmacy-pos/shared/types/entities';
import { purchaseOrderServiceV2 } from '../services/purchaseOrderServiceV2';
import usePurchaseOrderData from '../hooks/usePurchaseOrderData';
import usePurchaseOrderItems from '../hooks/usePurchaseOrderItems';
import BasicInfoForm from '../components/purchase-order-form/BasicInfoForm';
import ProductItemForm from '../components/purchase-order-form/ProductItemForm';
import ProductItemsTable from '../components/purchase-order-form/ProductItemsTable';
import GenericConfirmDialog from '../components/common/GenericConfirmDialog';
import ActionButtons from '../components/purchase-order-form/ActionButtons';
import TestModeConfig from '../testMode/config/TestModeConfig';
import testModeDataService from '../testMode/services/TestModeDataService';

// =================================================================
// 1. 型別定義 (Type Definitions)
// =================================================================

// 供應商的型別
interface ISupplier {
  _id: string;
  id?: string;
  name: string;
  [key: string]: any;
}

// 擴展 Product 類型以包含實際使用的欄位
interface ExtendedProduct extends Omit<Product, 'category' | 'supplier'> {
  id?: string;
  did?: string;
  dname?: string;
  category?: { name: string } | string;
  supplier?: { name: string } | string;
  [key: string]: any;
}

// 當前項目類型 (與 usePurchaseOrderItems hook 匹配)
interface CurrentItem {
  did: string;
  dname: string;
  dquantity: string;
  dtotalCost: string;
  product: string | null;
  [key: string]: any;
}

// 表單資料的完整型別 (與 hook 匹配)
interface IFormData {
  poid: string;
  pobill: string;
  pobilldate: Date;
  posupplier: string; // supplier name
  supplier: string; // Store supplier ID
  items: CurrentItem[];
  notes: string;
  status: string; // 使用字符串類型以適應所有可能的值
  paymentStatus: string;
  multiplierMode: string | number;
  [key: string]: any;
}

// Snackbar 狀態型別
interface ISnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// 初始狀態渲染 props 型別
interface RenderInitialStateProps {
  dataLoading: boolean;
  orderDataLoaded: boolean;
  isGlobalTestMode: boolean;
  dataError: any;
  isEditMode: boolean;
  orderData: any;
  products: ExtendedProduct[];
  suppliers: ISupplier[];
}

// 移除內部 mock 數據定義，改用統一的測試數據服務

// Helper function to adjust purchase order items with multiplier and rounding
// 擴展 PurchaseOrder 類型以包含實際使用的欄位
interface ExtendedPurchaseOrder extends PurchaseOrder {
  pobilldate?: Date | string;
  [key: string]: any;
}

// Helper function to adjust purchase order items with multiplier and rounding
const adjustPurchaseOrderItems = (items: CurrentItem[], multiplier: number): CurrentItem[] => {
  if (!items || items.length === 0) {
    return [];
  }

  let adjustedItems = items.map(item => ({
    ...item,
    dtotalCost: String(parseFloat((Number(item.dtotalCost ?? 0) * multiplier).toFixed(2)))
  }));

  const rawTotalAmountBeforeMultiplier = items.reduce((sum, item) => sum + Number(item.dtotalCost ?? 0), 0);
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
          dtotalCost: String(parseFloat((Number(item.dtotalCost) + roundingDifference).toFixed(2)))
        };
      }
      return item;
    });
  }
  return adjustedItems;
};

// Helper component/function to render initial loading or error states
const RenderInitialState: React.FC<RenderInitialStateProps> = ({
  dataLoading,
  orderDataLoaded,
  isGlobalTestMode,
  dataError,
  isEditMode,
  orderData,
  products,
  suppliers
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

// 輔助函數，用於從產品對象中獲取產品ID
const getProductId = (product: any): string | null => {
  if (typeof product === 'string') {
    return product;
  }
  if (product && typeof product === 'object') {
    return product._id;
  }
  return null;
};

const PurchaseOrderFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const isGlobalTestMode = useMemo(() => {
    return TestModeConfig.isEnabled();
  }, []);

  const [snackbar, setSnackbar] = useState<ISnackbarState>({ open: false, message: '', severity: 'success' });
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
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
    orderData,
    orderDataLoaded,
    suppliersLoaded: initialSuppliersLoaded,
    productsLoaded: initialProductsLoaded,
  } = usePurchaseOrderData(isEditMode, id, showSnackbar);

  // Create mutable versions of data for test mode modification
  let dataLoading = initialDataLoading;
  let dataError = initialDataError;
  let suppliers = initialSuppliers as ISupplier[];
  let products = initialProducts as unknown as ExtendedProduct[];
  // 移除未使用的變數賦值
  let suppliersLoaded = initialSuppliersLoaded;
  let productsLoaded = initialProductsLoaded;

  if (isGlobalTestMode) {
    // 使用統一的測試數據服務
    const testProducts = testModeDataService.getPurchaseOrderProducts(products as any, dataError);
    const testSuppliers = testModeDataService.getPurchaseOrderSuppliers(suppliers as any, dataError);

    if (!products || products.length === 0 || (dataError && !productsLoaded)) {
      products = testProducts as ExtendedProduct[];
      productsLoaded = true;
    }
    if (!suppliers || suppliers.length === 0 || (dataError && !suppliersLoaded)) {
      suppliers = testSuppliers as ISupplier[];
      suppliersLoaded = true;
    }
    // 如果有錯誤但我們有測試數據，清除錯誤和載入狀態
    if (dataError && (testProducts.length > 0 || testSuppliers.length > 0)) {
      dataError = null;
    }
    if (dataLoading && (productsLoaded || suppliersLoaded)) {
        dataLoading = false;
    }
  }

  const [formData, setFormData] = useState<IFormData>({
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

  const productInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);

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
    productsData: products as Product[],
    showSnackbar,
    productInputRef,
    formData,
    setFormData,
    productDetails,
    setProductDetails
  });

  // 移除未使用的變數賦值
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<ISupplier | null>(null);

  useEffect(() => {
    if (isEditMode && orderData) {
      console.log('載入編輯資料:', orderData); // 調試日誌
      
      const supplierId = typeof orderData.supplier === 'object' ? orderData.supplier._id : orderData.supplier;
      
      // 修復項目資料映射邏輯
      const mappedItems = Array.isArray(orderData.items)
        ? orderData.items.map(item => {
            console.log('處理項目:', item); // 調試日誌
            
            // 處理產品資訊
            let productCode = '';
            let productName = '';
            let productId = null;
            
            if (item.product) {
              if (typeof item.product === 'object') {
                // 產品是完整對象
                productCode = item.product.code || item.did || '';
                productName = item.product.name || item.dname || '';
                productId = item.product._id;
              } else {
                // 產品只是ID字符串
                productId = item.product;
                productCode = item.did || '';
                productName = item.dname || '';
              }
            } else {
              // 沒有產品對象，使用項目中的直接欄位
              productCode = item.did || '';
              productName = item.dname || '';
            }
            
            return {
              did: productCode,
              dname: productName,
              dquantity: String(item.dquantity || item.quantity || ''),
              dtotalCost: String(item.dtotalCost || item.subtotal || ''),
              product: productId
            };
          })
        : [];
        
      console.log('映射後的項目:', mappedItems); // 調試日誌
        
      setFormData({
        poid: orderData.poid || orderData.orderNumber || '',
        pobill: orderData.pobill || '',
        pobilldate: (() => {
          let dateToUse = new Date();
          if (orderData.pobilldate) {
            dateToUse = new Date(orderData.pobilldate);
          } else if (orderData.orderDate) {
            dateToUse = new Date(orderData.orderDate);
          }
          return dateToUse;
        })(),
        posupplier: orderData.posupplier ||
                   (orderData.supplier && typeof orderData.supplier === 'object' ? orderData.supplier.name : ''),
        supplier: supplierId,
        items: mappedItems,
        notes: orderData.notes ?? '',
        status: orderData.status ?? 'pending',
        paymentStatus: orderData.paymentStatus || '未付',
        multiplierMode: ''
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
    let timerId: NodeJS.Timeout | undefined;
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

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date: Date | null) => {
    setFormData({ ...formData, pobilldate: date || new Date() });
  };

  const handleSupplierChange = (_event: React.SyntheticEvent, supplier: ISupplier | null) => {
    setSelectedSupplier(supplier);
    setFormData({
      ...formData,
      posupplier: supplier ? supplier.name : '',
      supplier: supplier ? (supplier.id || supplier._id) : ''
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.posupplier || !formData.supplier) {
      showSnackbar('請填寫所有必填欄位 (供應商)', 'error');
      return;
    }
    if (formData.items.length === 0) {
      showSnackbar('請至少添加一個藥品項目', 'error');
      return;
    }
    if (formData.status === 'completed' && !isGlobalTestMode) { // 'completed' 是一個可能的值
      setConfirmDialogOpen(true);
      return;
    }
    submitForm();
  };

  const submitForm = async () => {
    // 移除對未使用變數的賦值

    if (isGlobalTestMode) {
      console.log('TEST MODE: Simulating form submission with data:', formData);
      showSnackbar(`進貨單已在測試模式下模擬${isEditMode ? '更新' : '新增'}成功`, 'success');
      setTimeout(() => { navigate('/purchase-orders'); }, 1500);
      // 移除對未使用變數的賦值
      setConfirmDialogOpen(false);
      return;
    }

    const multiplier = getMultiplier();
    const finalAdjustedItems = adjustPurchaseOrderItems(formData.items, multiplier);

    // 使用類型斷言確保 status 符合 PurchaseOrder 接口的要求
    const status = formData.status as "pending" | "approved" | "received" | "cancelled";
    
    // 保持原始的 formData 結構，只轉換數據類型
    const submitData = {
      ...formData,
      pobilldate: format(formData.pobilldate, 'yyyy-MM-dd'),
      items: finalAdjustedItems.map(item => ({
        ...item,
        dquantity: Number(item.dquantity),
        dtotalCost: Number(item.dtotalCost),
      })),
      status: status
    };

    try {
      if (isEditMode && id) {
        await purchaseOrderServiceV2.updatePurchaseOrder(id, submitData as any);
        showSnackbar('進貨單已成功更新', 'success');
      } else {
        await purchaseOrderServiceV2.createPurchaseOrder(submitData as any);
        showSnackbar('進貨單已成功新增', 'success');
      }
      setTimeout(() => { navigate('/purchase-orders'); }, 1500);
    } catch (err: unknown) {
      console.error('提交進貨單失敗:', err);
      const error = err as { response?: { data?: { msg?: string } }, message?: string };
      showSnackbar('提交進貨單失敗: ' + (error.response?.data?.msg ?? error.message ?? '未知錯誤'), 'error');
    } finally {
      // 移除對未使用變數的賦值
      setConfirmDialogOpen(false);
    }
  };

  const handleConfirmComplete = () => {
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
    navigate('/purchase-orders');
  };

  // 計算倍率係數
  const getMultiplier = (): number => {
    const multiplierValue = parseFloat(formData.multiplierMode as string);
    if (!multiplierValue || isNaN(multiplierValue)) {
      return 1; // 無倍率或無效值時返回1（不調整）
    }
    return 1 + (multiplierValue / 100); // 轉換為倍率係數
  };

  // 計算總金額（含倍率調整） for display
  const rawTotalAmountForDisplay = formData.items.reduce((sum, item) => sum + Number(item.dtotalCost ?? 0), 0);
  const currentMultiplierForDisplay = getMultiplier();
  const adjustedTotalAmountForDisplay = rawTotalAmountForDisplay * currentMultiplierForDisplay;
  const totalAmountForDisplay = Math.round(adjustedTotalAmountForDisplay);
  
  // 對話框標題獲取函數
  const getDialogTitle = (): string => {
    if (isGlobalTestMode) {
      return "測試模式確認";
    }
    return formData.status === 'completed' ? "確認完成進貨單" : "確認提交"; // 'completed' 是一個可能的值
  };

  // 對話框訊息獲取函數
  const getDialogMessage = (): string => {
    if (isGlobalTestMode) {
      return "此為測試模式，操作不會實際儲存。是否繼續？";
    }
    return formData.status === 'completed' // 'completed' 是一個可能的值
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
    <Box sx={{
      p: { xs: 1, sm: 1.5, md: 2 },
      height: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      '@media (max-width: 600px)': {
        height: 'calc(100vh - 56px)'
      }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5" component="h1">
          {isEditMode ? '編輯進貨單' : '新增進貨單'}
          {isGlobalTestMode && <Typography variant="caption" color="secondary" sx={{ ml: 1 }}>(測試模式)</Typography>}
        </Typography>
        <ActionButtons onCancel={handleCancel} />
      </Box>

      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <BasicInfoForm
          formData={formData}
          handleInputChange={handleFormInputChange}
          handleDateChange={handleDateChange}
          handleSupplierChange={handleSupplierChange}
          suppliers={suppliers || []}
          selectedSupplier={selectedSupplier}
          isEditMode={isEditMode}
          isTestMode={isGlobalTestMode}
        />

        <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <CardContent sx={{ pb: 1, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>藥品項目</Typography>
            
            <Box sx={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10, pb: 1, borderBottom: '1px solid #e0e0e0' }}>
              <ProductItemForm
                currentItem={currentItem}
                handleItemInputChange={handleItemInputChange}
                handleProductChange={handleProductChange}
                handleAddItem={handleAddItem}
                products={products || []}
                productInputRef={productInputRef}
                isTestMode={isGlobalTestMode}
              />
            </Box>
            
            <Box sx={{ flex: 1, overflowY: 'auto', minHeight: '200px' }}>
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
                codeField="did"
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