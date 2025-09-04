/**
 * 銷售編輯管理 Hook (RTK Query 版本)
 * 用於管理銷售編輯的狀態和操作
 */
import { useState, useEffect, useCallback, KeyboardEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Product } from '@pharmacy-pos/shared/types/entities';
import {
  SaleDataDto,
  SaleItemWithDetailsDto,
  mapSaleDataToSaleRequest
} from '../api/dto';
import {
  useGetSaleDataByIdQuery,
  useUpdateSaleMutation
} from '../api/saleApi';
import {
  setFormDirty,
  setFormSubmitting,
  showNotification,
  selectSaleEditFormState
} from '../model/saleSlice';
import { InputMode, SnackbarState } from '../types/edit';
import { findProductByCode, calculateTotalAmount } from '../utils/editUtils';

// 默認的表單狀態，用於防禦性編程
const defaultFormState = {
  isDirty: false,
  isSubmitting: false,
  validationErrors: {}
};

/**
 * 銷售編輯管理 Hook
 * 
 * @param saleId 銷售記錄ID
 * @param products 產品列表
 * @returns 銷售編輯的狀態和操作函數
 */
export const useSaleEdit = (saleId: string, products: Product[]) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // 使用自定義選擇器，添加防禦性代碼處理 state.sale.edit 為 undefined 的情況
  const formState = useSelector((state: any) => {
    try {
      // 嘗試使用原始選擇器
      return selectSaleEditFormState(state);
    } catch (error) {
      // 如果出錯，返回默認表單狀態
      console.warn('無法獲取銷售編輯表單狀態，使用默認值', error);
      return defaultFormState;
    }
  });
  
  // 使用 RTK Query 獲取銷售數據
  const { 
    data: initialSaleData, 
    isLoading, 
    isError, 
    error 
  } = useGetSaleDataByIdQuery(saleId, {
    skip: !saleId // 如果沒有 saleId，跳過查詢
  });
  
  // 使用 RTK Query 的更新銷售 mutation
  const [updateSale, { isLoading: isUpdating }] = useUpdateSaleMutation();
  
  // 本地狀態
  const [currentSale, setCurrentSale] = useState<SaleDataDto>({
    customer: '',
    items: [],
    totalAmount: 0,
    discount: 0,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    note: ''
  });
  const [barcode, setBarcode] = useState<string>('');
  const [inputModes, setInputModes] = useState<InputMode[]>([]);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 初始化銷售數據
  useEffect(() => {
    if (initialSaleData) {
      // 創建一個深拷貝，確保 currentSale 是可變的
      setCurrentSale(JSON.parse(JSON.stringify(initialSaleData)));
      // 初始化輸入模式，預設為單價模式
      setInputModes(new Array(initialSaleData.items.length).fill('price'));
      
      // 重置表單狀態
      dispatch(setFormDirty(false));
      dispatch(setFormSubmitting(false));
    }
  }, [initialSaleData, dispatch]);

  // 計算總金額
  useEffect(() => {
    const total = calculateTotalAmount(currentSale.items, currentSale.discount);
    setCurrentSale(prev => ({
      ...prev,
      totalAmount: total
    }));
    
    // 標記表單為已修改
    if (initialSaleData && JSON.stringify(initialSaleData) !== JSON.stringify(currentSale)) {
      dispatch(setFormDirty(true));
    }
  }, [currentSale.items, currentSale.discount, initialSaleData, dispatch]);

  // 處理輸入變更
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentSale(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // 處理條碼輸入變更
  const handleBarcodeChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  }, []);

  // 處理條碼提交
  const handleBarcodeSubmit = useCallback(async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcode.trim()) {
      e.preventDefault();
      const trimmedBarcode = barcode.trim();
      setBarcode('');

      try {
        // 使用工具函數查找產品
        const product = findProductByCode(trimmedBarcode, products);

        if (product) {
          const existingItemIndex = currentSale.items.findIndex(item => item.product === product?._id);
          let updatedItems: SaleItemWithDetailsDto[];

          if (existingItemIndex >= 0) {
            updatedItems = [...currentSale.items];
            const existingItem = updatedItems[existingItemIndex];
            if (existingItem) {
              existingItem.quantity += 1;
              existingItem.subtotal = existingItem.price * existingItem.quantity;
            }
            setSnackbar({ open: true, message: `已增加 ${product.name} 的數量`, severity: 'success' });
          } else {
            const newItem: SaleItemWithDetailsDto = {
              product: product._id,
              productDetails: product,
              name: product.name,
              code: product.code,
              price: product.sellingPrice ?? product.price ?? 0,
              quantity: 1,
              subtotal: product.sellingPrice ?? product.price ?? 0,
              productType: (product as any).productType
            };
            updatedItems = [...currentSale.items, newItem];
            
            // 同時更新輸入模式
            setInputModes(prev => [...prev, 'price']);
            
            setSnackbar({ open: true, message: `已添加 ${product.name}`, severity: 'success' });
          }
          setCurrentSale(prev => ({ ...prev, items: updatedItems }));
        } else {
          setSnackbar({ open: true, message: `找不到條碼/代碼/簡碼/健保碼 ${trimmedBarcode} 對應的產品`, severity: 'error' });
        }
      } catch (err) {
        console.error('處理條碼失敗:', err);
        setSnackbar({ open: true, message: '處理條碼失敗', severity: 'error' });
      }
    }
  }, [barcode, products, currentSale.items]);

  // 處理數量變更
  const handleQuantityChange = useCallback((index: number, newQuantity: number | string) => {
    const updatedItems = [...currentSale.items];
    const currentItem = updatedItems[index];
    
    if (!currentItem) return;
    
    if (typeof newQuantity === 'string') {
      // 處理字串輸入（暫時允許空字串）
      currentItem.quantity = newQuantity === '' ? 0 : parseInt(newQuantity);
      if (newQuantity !== '') {
        currentItem.subtotal = currentItem.price * currentItem.quantity;
      }
      setCurrentSale(prev => ({ ...prev, items: updatedItems }));
      return;
    }
    
    if (newQuantity < 1) return;
    currentItem.quantity = newQuantity;
    currentItem.subtotal = currentItem.price * newQuantity;
    setCurrentSale(prev => ({ ...prev, items: updatedItems }));
  }, [currentSale.items]);

  // 處理價格變更
  const handlePriceChange = useCallback((index: number, newPriceStr: string) => {
    const updatedItems = [...currentSale.items];
    const currentItem = updatedItems[index];
    
    if (!currentItem) return;
    
    if (newPriceStr === '') {
        currentItem.price = 0;
        currentItem.subtotal = 0;
    } else {
        const newPrice = parseFloat(newPriceStr);
        if (!isNaN(newPrice) && newPrice >= 0) {
            currentItem.price = newPrice;
            currentItem.subtotal = newPrice * currentItem.quantity;
        } else {
            return;
        }
    }
    setCurrentSale(prev => ({ ...prev, items: updatedItems }));
  }, [currentSale.items]);

  // 處理價格失去焦點
  const handlePriceBlur = useCallback((index: number) => {
    const item = currentSale.items[index];
    if (item && (item.price === 0 || isNaN(parseFloat(item.price.toString())))) {
        handlePriceChange(index, '0');
    }
  }, [currentSale.items, handlePriceChange]);

  // 處理小計變更
  const handleSubtotalChange = useCallback((index: number, newSubtotal: number) => {
    if (newSubtotal < 0) return;
    const updatedItems = [...currentSale.items];
    const currentItem = updatedItems[index];
    
    if (!currentItem) return;
    
    currentItem.subtotal = newSubtotal;
    if (currentItem.quantity > 0) {
      currentItem.price = newSubtotal / currentItem.quantity;
    } else {
      currentItem.price = 0;
    }
    setCurrentSale(prev => ({ ...prev, items: updatedItems }));
  }, [currentSale.items]);

  // 切換輸入模式
  const toggleInputMode = useCallback((index: number) => {
    setInputModes(prevModes => {
      const updatedModes = [...prevModes];
      const currentMode = updatedModes[index];
      if (currentMode) {
        updatedModes[index] = currentMode === 'price' ? 'subtotal' : 'price';
      }
      return updatedModes;
    });
  }, []);

  // 處理移除項目
  const handleRemoveItem = useCallback((index: number) => {
    const updatedItems = [...currentSale.items];
    updatedItems.splice(index, 1);
    setCurrentSale(prev => ({ ...prev, items: updatedItems }));
    
    // 同時移除對應的輸入模式
    setInputModes(prevModes => {
      const updatedModes = [...prevModes];
      updatedModes.splice(index, 1);
      return updatedModes;
    });
  }, [currentSale.items]);

  // 處理更新銷售記錄
  const handleUpdateSale = useCallback(async () => {
    if (currentSale.items.length === 0) {
      setSnackbar({ open: true, message: '請添加至少一個銷售項目', severity: 'error' });
      return;
    }

    // 標記表單為提交中
    dispatch(setFormSubmitting(true));

    try {
      // 使用工具函數準備提交數據
      const saleData = mapSaleDataToSaleRequest(currentSale);

      // 使用 RTK Query 更新銷售記錄
      await updateSale({ id: saleId, data: saleData }).unwrap();
      
      // 顯示成功通知
      dispatch(showNotification({ message: '銷售記錄已更新', type: 'success' }));
      setSnackbar({ open: true, message: '銷售記錄已更新', severity: 'success' });
      
      // 重置表單狀態
      dispatch(setFormDirty(false));
      dispatch(setFormSubmitting(false));
      
      // 導航回列表頁面
      setTimeout(() => navigate('/sales'), 1500);
    } catch (err: any) {
      console.error('更新銷售記錄失敗:', err);
      
      // 顯示錯誤通知
      const errorMessage = `更新銷售記錄失敗: ${err.data?.message || err.message || '未知錯誤'}`;
      dispatch(showNotification({ message: errorMessage, type: 'error' }));
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      
      // 重置表單狀態
      dispatch(setFormSubmitting(false));
    }
  }, [currentSale, saleId, navigate, dispatch, updateSale]);

  // 處理關閉 Snackbar
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return {
    currentSale,
    barcode,
    inputModes,
    isLoading,
    isError,
    error,
    isUpdating,
    formState,
    handleBarcodeChange,
    handleBarcodeSubmit,
    handleInputChange,
    handleQuantityChange,
    handlePriceChange,
    handlePriceBlur,
    handleSubtotalChange,
    toggleInputMode,
    handleRemoveItem,
    handleUpdateSale,
    snackbar,
    handleCloseSnackbar
  };
};