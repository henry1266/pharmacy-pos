import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../hooks/redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Button,
  CircularProgress,
  Grid
} from '@mui/material';
import { format } from 'date-fns';
import { DropResult } from 'react-beautiful-dnd';
import { Product, Supplier } from '@pharmacy-pos/shared/types/entities';
import { RootState } from '../redux/store';
import {
  fetchShippingOrder,
  addShippingOrder,
  updateShippingOrder,
  fetchSuppliers,
  fetchProducts
} from '../redux/actions';

// 導入拆分後的組件
import PageHeader from '../components/shipping-orders/PageHeader';
import ActionButtons from '../components/shipping-orders/form/ActionButtons';
import BasicInfoForm from '../components/shipping-orders/form/BasicInfo/index';
import ProductItemForm from '../components/shipping-orders/form/ProductItems/ItemForm';
import ItemsTable from '../components/shipping-orders/form/ProductItems/ItemsTable';
import GenericConfirmDialog from '../components/common/GenericConfirmDialog';
import TestModeConfig from '../testMode/config/TestModeConfig';
import testModeDataService from '../testMode/services/TestModeDataService';
import useShippingOrderItems from '../hooks/useShippingOrderItems';

// =================================================================
// 1. 型別定義 (Type Definitions)
// =================================================================

// 供應商的型別 - 擴展 shared Supplier
interface ISupplier extends Omit<Supplier, 'id'> {
  _id: string;
  id?: string;
  [key: string]: any;
}

// 擴展 Product 類型以包含實際使用的欄位
interface ExtendedProduct extends Omit<Product, 'category' | 'supplier' | 'purchasePrice'> {
  _id: string;
  code: string;
  name: string;
  shortCode?: string;
  healthInsuranceCode?: string;
  barcode?: string;
  purchasePrice?: string | number;
  category?: { name: string } | string;
  supplier?: { name: string } | string;
  [key: string]: any;
}

// 產品詳情映射介面
interface ProductDetailsMap {
  [productCode: string]: Product & { stock: number };
}

// 當前項目類型
interface CurrentItem {
  did: string;
  dname: string;
  dquantity: string;
  dtotalCost: string;
  batchNumber?: string;
  packageQuantity?: string;
  boxQuantity?: string;
  product: string | null | undefined;
  [key: string]: any;
}

// 表單資料的完整型別
interface IFormData {
  soid: string;
  sobill: string;
  sobilldate: Date;
  sosupplier: string; // supplier name
  supplier: string; // Store supplier ID
  items: CurrentItem[];
  notes: string;
  status: 'pending' | 'completed' | 'cancelled';
  paymentStatus: '未收' | '已收款' | '已開立';
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

// Helper function to adjust shipping order items with multiplier and rounding
const adjustShippingOrderItems = (items: CurrentItem[], multiplier: number): CurrentItem[] => {
  if (!items || items.length === 0) {
    return [];
  }

  // 保留所有原始屬性，只調整 dtotalCost
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
      return Number(item.dtotalCost) > Number(arr[maxIndex]?.dtotalCost || 0) ? currentIndex : maxIndex;
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

const ShippingOrderFormPage: React.FC = () => {
  const dispatch = useAppDispatch();
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

  // 從 Redux 獲取數據
  const { currentShippingOrder, loading: initialDataLoading, error: initialDataError } = useSelector((state: RootState) => state.shippingOrders);
  const { suppliers: initialSuppliers } = useSelector((state: RootState) => state.suppliers);
  const { products: initialProducts } = useSelector((state: RootState) => state.products);

  // 創建可變版本的數據，用於測試模式修改
  let dataLoading = initialDataLoading;
  let dataError = initialDataError;
  let suppliers = initialSuppliers as unknown as ISupplier[];
  let products = initialProducts as unknown as ExtendedProduct[];
  let orderData = currentShippingOrder;
  let orderDataLoaded = !!currentShippingOrder;
  let suppliersLoaded = !!initialSuppliers?.length;
  let productsLoaded = !!initialProducts?.length;

  if (isGlobalTestMode) {
    // 使用統一的測試數據服務
    const testProducts = testModeDataService.getPurchaseOrderProducts(products as any, dataError);
    const testSuppliers = testModeDataService.getPurchaseOrderSuppliers(suppliers as any, dataError);

    if (!products || products.length === 0 || (dataError && !productsLoaded)) {
      products = testProducts as unknown as ExtendedProduct[];
      productsLoaded = true;
    }
    if (!suppliers || suppliers.length === 0 || (dataError && !suppliersLoaded)) {
      suppliers = testSuppliers as unknown as ISupplier[];
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
    soid: '',
    sobill: '',
    sobilldate: new Date(),
    sosupplier: '', // supplier name
    supplier: '', // Store supplier ID
    items: [],
    notes: '',
    status: 'pending',
    paymentStatus: '未收',
    multiplierMode: ''
  });

  // 產品詳情映射
  const [productDetails, setProductDetails] = useState<ProductDetailsMap>({});

  const productInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  // 使用 useShippingOrderItems hook
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
    handleMainQuantityChange,
  } = useShippingOrderItems({
    showSnackbar,
    productInputRef,
    formData: formData as any,
    setFormData: setFormData as any,
    productDetails,
    setProductDetails,
    productsData: products as Product[]
  });

  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<ISupplier | null>(null);

  useEffect(() => {
    dispatch(fetchSuppliers());
    dispatch(fetchProducts());
    
    if (isEditMode && id) {
      dispatch(fetchShippingOrder(id));
    }
  }, [dispatch, isEditMode, id]);

  // 在編輯模式下載入出貨單數據
  useEffect(() => {
    const loadEditData = async () => {
      if (isEditMode && orderData && products) {
        console.log('載入編輯資料:', orderData);
        
        const supplierId = typeof orderData.supplier === 'object' ? orderData.supplier._id : orderData.supplier;
        
        // 修復項目資料映射邏輯
        const mappedItems = Array.isArray(orderData.items)
          ? await Promise.all(orderData.items.map(async (item: any) => {
              console.log('處理項目:', item);
              
              // 處理產品資訊
              let productCode = '';
              let productName = '';
              let productId: string | null = null;
              let productPackageUnits: any[] = [];
              
              if (item.product) {
                if (typeof item.product === 'object') {
                  // 產品是完整對象
                  productCode = item.product.code || item.did || '';
                  productName = item.product.name || item.dname || '';
                  productId = item.product._id;
                  productPackageUnits = item.product.packageUnits || [];
                } else {
                  // 產品只是ID字符串，需要從 products 中查找
                  productId = item.product;
                  productCode = item.did || '';
                  productName = item.dname || '';
                  
                  // 從已載入的產品列表中查找包裝單位資料
                  const foundProduct = products?.find((p: any) => p._id === productId);
                  if (foundProduct) {
                    productPackageUnits = foundProduct.packageUnits || [];
                  }
                }
              } else {
                // 沒有產品對象，使用項目中的直接欄位
                productCode = item.did || '';
                productName = item.dname || '';
                
                // 嘗試通過產品代碼查找產品
                const foundProduct = products?.find((p: any) => p.code === productCode);
                if (foundProduct) {
                  productId = foundProduct._id;
                  productPackageUnits = foundProduct.packageUnits || [];
                }
              }
              
              // 確保從後端獲取的 packageQuantity 和 boxQuantity 值被正確處理
              const packageQuantity = (item as any).packageQuantity !== undefined && (item as any).packageQuantity !== null
                ? String((item as any).packageQuantity)
                : '';
              
              const boxQuantity = (item as any).boxQuantity !== undefined && (item as any).boxQuantity !== null
                ? String((item as any).boxQuantity)
                : '';
              
              console.log('處理大包裝數據:', {
                packageQuantity,
                boxQuantity
              });
              
              return {
                did: productCode,
                dname: productName,
                dquantity: String(item.dquantity || item.quantity || ''),
                dtotalCost: String(item.dtotalCost || item.subtotal || ''),
                batchNumber: item.batchNumber || '', // 加入批號欄位
                packageQuantity: packageQuantity, // 加入大包裝數量欄位
                boxQuantity: boxQuantity, // 加入盒裝數量欄位
                product: productId,
                packageUnits: productPackageUnits // 加入包裝單位資料
              };
            }))
          : [];
        
        console.log('映射後的項目:', mappedItems);
          
        setFormData({
          soid: orderData.soid || orderData.orderNumber || '',
          sobill: (orderData as any).sobill || '',
          sobilldate: (() => {
            let dateToUse = new Date();
            if ((orderData as any).sobilldate) {
              dateToUse = new Date((orderData as any).sobilldate);
            } else if (orderData.orderDate) {
              dateToUse = new Date(orderData.orderDate);
            }
            return dateToUse;
          })(),
          sosupplier: orderData.sosupplier ||
                     (orderData.supplier && typeof orderData.supplier === 'object' ? orderData.supplier.name : ''),
          supplier: supplierId || '',
          items: mappedItems,
          notes: orderData.notes ?? '',
          status: (orderData.status as 'pending' | 'completed' | 'cancelled') ?? 'pending',
          paymentStatus: (orderData.paymentStatus as '未收' | '已收款' | '已開立') || '未收',
          multiplierMode: ''
        });
      }
    };
    
    loadEditData();
  }, [isEditMode, orderData, products]);

  useEffect(() => {
    if (isEditMode && orderDataLoaded && suppliersLoaded && formData.supplier && suppliers && suppliers.length > 0) {
      const supplierObj = suppliers.find(s => s._id === formData.supplier);
      if (supplierObj) {
        setSelectedSupplier(supplierObj);
        if (formData.sosupplier !== supplierObj.name) {
          setFormData(prev => ({ ...prev, sosupplier: supplierObj.name }));
        }
      }
    }
  }, [isEditMode, orderDataLoaded, suppliersLoaded, formData.supplier, formData.sosupplier, suppliers]);

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

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date: Date | null) => {
    setFormData({ ...formData, sobilldate: date || new Date() });
  };

  const handleSupplierChange = (supplier: ISupplier | null) => {
    setSelectedSupplier(supplier);
    setFormData({
      ...formData,
      sosupplier: supplier ? supplier.name : '',
      supplier: supplier ? supplier._id : ''
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.supplier) {
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

  // 計算倍率係數
  const getMultiplier = (): number => {
    const multiplierValue = parseFloat(formData.multiplierMode as string);
    if (!multiplierValue || isNaN(multiplierValue)) {
      return 1; // 無倍率或無效值時返回1（不調整）
    }
    return 1 + (multiplierValue / 100); // 轉換為倍率係數
  };

  const submitForm = async () => {
    if (isGlobalTestMode) {
      console.log('TEST MODE: Simulating form submission with data:', formData);
      showSnackbar(`出貨單已在測試模式下模擬${isEditMode ? '更新' : '新增'}成功`, 'success');
      setTimeout(() => { navigate('/shipping-orders'); }, 1500);
      setConfirmDialogOpen(false);
      return;
    }

    // 輸出原始表單數據，檢查大包裝相關屬性
    console.log('原始表單數據:', JSON.stringify(formData.items.map(item => ({
      did: item.did,
      dname: item.dname,
      packageQuantity: item.packageQuantity,
      boxQuantity: item.boxQuantity
    })), null, 2));
    
    // 詳細輸出每個項目的大包裝相關屬性
    formData.items.forEach((item, index) => {
      console.log(`提交表單 - 項目 ${index + 1} (${item.did} - ${item.dname}) 的大包裝相關屬性:`, {
        packageQuantity: item.packageQuantity,
        boxQuantity: item.boxQuantity,
        packageQuantity類型: typeof item.packageQuantity,
        boxQuantity類型: typeof item.boxQuantity
      });
    });

    const multiplier = getMultiplier();
    const finalAdjustedItems = adjustShippingOrderItems(formData.items, multiplier);

    // 輸出調整後的項目，檢查大包裝相關屬性是否保留
    console.log('調整後的項目:', JSON.stringify(finalAdjustedItems.map(item => ({
      did: item.did,
      dname: item.dname,
      packageQuantity: item.packageQuantity,
      boxQuantity: item.boxQuantity
    })), null, 2));

    // 使用類型斷言確保 status 符合接口的要求
    const status = formData.status as "pending" | "completed" | "cancelled";
    
    // 保持原始的 formData 結構，只轉換數據類型
    const submitData: any = {
      soid: formData.soid,
      sosupplier: formData.sosupplier,
      supplier: formData.supplier,
      items: finalAdjustedItems.map(item => {
        // 輸出每個項目的大包裝相關屬性
        console.log(`處理項目 ${item.did} (${item.dname}) 的大包裝數據:`, {
          packageQuantity: item.packageQuantity,
          boxQuantity: item.boxQuantity
        });

        // 基本項目數據
        const result = {
          did: item.did,
          dname: item.dname,
          dquantity: Number(item.dquantity),
          dtotalCost: Number(item.dtotalCost),
          product: item.product || undefined,
          unitPrice: Number(item.dquantity) > 0 ? Number(item.dtotalCost) / Number(item.dquantity) : 0,
          notes: '',
          batchNumber: item.batchNumber
        };

        // 完全參照進貨單的 submitForm 函數處理大包裝相關屬性
        // 使用條件運算符處理空字符串，將其轉換為 undefined
        (result as any).packageQuantity = item.packageQuantity && item.packageQuantity !== '' ? Number(item.packageQuantity) : undefined;
        (result as any).boxQuantity = item.boxQuantity && item.boxQuantity !== '' ? Number(item.boxQuantity) : undefined;
        // unit 屬性不再需要設置

        // 輸出處理後的項目數據
        console.log(`處理後的項目 ${item.did} (${item.dname}) 數據:`, {
          ...result,
          packageQuantity: (result as any).packageQuantity,
          boxQuantity: (result as any).boxQuantity,
          packageQuantity類型: typeof (result as any).packageQuantity,
          boxQuantity類型: typeof (result as any).boxQuantity
        });

        return result;
      }),
      totalAmount: finalAdjustedItems.reduce((sum, item) => sum + Number(item.dtotalCost), 0),
      status: status,
      paymentStatus: formData.paymentStatus,
      notes: formData.notes,
      sobill: formData.sobill,
      sobilldate: format(formData.sobilldate, 'yyyy-MM-dd')
    };
    
    console.log('最終提交數據:', JSON.stringify(submitData, null, 2));
    
    try {
      if (isEditMode && id) {
        await dispatch(updateShippingOrder(id, submitData, navigate));
        showSnackbar('出貨單已成功更新', 'success');
      } else {
        await dispatch(addShippingOrder(submitData, navigate));
        showSnackbar('出貨單已成功新增', 'success');
      }
      setTimeout(() => { navigate('/shipping-orders'); }, 1500);
    } catch (err: unknown) {
      console.error('提交出貨單失敗:', err);
      const error = err as { response?: { data?: { msg?: string } }, message?: string };
      showSnackbar('提交出貨單失敗: ' + (error.response?.data?.msg ?? error.message ?? '未知錯誤'), 'error');
    } finally {
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
    navigate('/shipping-orders');
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    const newItems = Array.from(formData.items);
    const [reorderedItem] = newItems.splice(sourceIndex, 1);
    if (reorderedItem) {
      newItems.splice(destinationIndex, 0, reorderedItem);
    }

    setFormData(prev => ({ ...prev, items: newItems }));
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
    return formData.status === 'completed' ? "確認完成出貨單" : "確認提交";
  };

  // 對話框訊息獲取函數
  const getDialogMessage = (): string => {
    if (isGlobalTestMode) {
      return "此為測試模式，操作不會實際儲存。是否繼續？";
    }
    return formData.status === 'completed'
      ? "您確定要將此出貨單標記為完成嗎？完成後將無法修改。" 
      : "您確定要提交此出貨單嗎？";
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
      p: { xs: 1, sm: 1, md: 1.5 },
      height: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
  
      '@media (max-width: 600px)': {
        height: 'calc(100vh - 56px)'
      }
    }}>
      {/* 使用新的 PageHeader 組件 */}
      <PageHeader
        mode={isEditMode ? 'edit' : 'new'}
        onNavigateToList={handleCancel}
        editId={id}
        actionButtons={
          <ActionButtons
            onCancel={handleCancel}
            loading={dataLoading}
            onSubmit={() => {
              // 手動觸發表單提交
              const formElement = document.querySelector('form');
              if (formElement) {
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                formElement.dispatchEvent(submitEvent);
              }
            }}
          />
        }
      />
      
      {isGlobalTestMode && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="secondary">(測試模式)</Typography>
        </Box>
      )}

      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
          {/* 左側：基本資訊 */}
          <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column' }}>
            <BasicInfoForm
              formData={formData}
              handleInputChange={handleFormInputChange}
              handleSupplierChange={handleSupplierChange}
              suppliers={suppliers || []}
              selectedSupplier={selectedSupplier}
              isEditMode={isEditMode}
              autoFocus={!isEditMode}
            />
          </Grid>

          {/* 右側：藥品項目 */}
          <Grid item xs={12} md={9} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <CardContent sx={{ pb: 1, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>藥品項目</Typography>
                
                <Box sx={{ position: 'sticky', top: 0, zIndex: 10, pb: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <ProductItemForm
                    currentItem={currentItem as any}
                    handleItemInputChange={handleItemInputChange}
                    handleProductChange={handleProductChange as any}
                    handleAddItem={handleAddItem}
                    products={products}
                    autoFocus={isEditMode}
                    handleMainQuantityChange={handleMainQuantityChange as any}
                  />
                </Box>
                
                <Box sx={{ flex: 1, overflowY: 'auto', minHeight: '200px' }}>
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
                    totalAmount={totalAmountForDisplay}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

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

export default ShippingOrderFormPage;