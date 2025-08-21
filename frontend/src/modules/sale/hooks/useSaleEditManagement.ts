import { useState, useEffect, useCallback, ChangeEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateSale } from '../../../services/salesServiceV2';
import { Product } from '@pharmacy-pos/shared/types/entities';
import { SaleData, SaleItem, SnackbarState, InputMode } from '../types/edit';
import { findProductByCode, calculateTotalAmount, prepareSaleDataForSubmission } from '../utils/editUtils';

/**
 * 銷售編輯管理 Hook
 * 用於管理銷售編輯的狀態和操作
 * 
 * @param initialSaleData 初始銷售數據
 * @param products 產品列表
 * @param saleId 銷售記錄ID
 * @returns 銷售編輯的狀態和操作函數
 */
export const useSaleEditManagement = (
  initialSaleData: SaleData | null,
  products: Product[],
  saleId: string
) => {
  const navigate = useNavigate();
  const [currentSale, setCurrentSale] = useState<SaleData>({
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
      setCurrentSale(initialSaleData);
      // 初始化輸入模式，預設為單價模式
      setInputModes(new Array(initialSaleData.items.length).fill('price'));
    }
  }, [initialSaleData]);

  // 計算總金額
  useEffect(() => {
    const total = calculateTotalAmount(currentSale.items, currentSale.discount);
    setCurrentSale(prev => ({
      ...prev,
      totalAmount: total
    }));
  }, [currentSale.items, currentSale.discount]);

  /**
   * 處理輸入變更
   * 用於處理表單輸入變更，如客戶、折扣、付款方式等
   */
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentSale(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  /**
   * 處理條碼輸入變更
   */
  const handleBarcodeChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  }, []);

  /**
   * 處理條碼提交
   * 當用戶按下 Enter 鍵時，根據條碼查找產品並添加到銷售項目中
   */
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
          let updatedItems: SaleItem[];

          if (existingItemIndex >= 0) {
            updatedItems = [...currentSale.items];
            const existingItem = updatedItems[existingItemIndex];
            if (existingItem) {
              existingItem.quantity += 1;
              existingItem.subtotal = existingItem.price * existingItem.quantity;
            }
            setSnackbar({ open: true, message: `已增加 ${product.name} 的數量`, severity: 'success' });
          } else {
            const newItem: SaleItem = {
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

  /**
   * 處理數量變更
   */
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

  /**
   * 處理價格變更
   */
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

  /**
   * 處理價格失去焦點
   */
  const handlePriceBlur = useCallback((index: number) => {
    const item = currentSale.items[index];
    if (item && (item.price === 0 || isNaN(parseFloat(item.price.toString())))) {
        handlePriceChange(index, '0');
    }
  }, [currentSale.items, handlePriceChange]);

  /**
   * 處理小計變更
   */
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

  /**
   * 切換輸入模式
   */
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

  /**
   * 處理移除項目
   */
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

  /**
   * 處理更新銷售記錄
   */
  const handleUpdateSale = useCallback(async () => {
    if (currentSale.items.length === 0) {
      setSnackbar({ open: true, message: '請添加至少一個銷售項目', severity: 'error' });
      return;
    }

    // 使用工具函數準備提交數據
    const saleData = prepareSaleDataForSubmission(currentSale);

    try {
      // 使用 V2 服務更新銷售記錄
      await updateSale(saleId, saleData);
      setSnackbar({ open: true, message: '銷售記錄已更新', severity: 'success' });
      setTimeout(() => navigate('/sales'), 1500);
    } catch (err: any) {
      console.error('更新銷售記錄失敗:', err);
      setSnackbar({ open: true, message: `更新銷售記錄失敗: ${err.response?.data?.msg ?? err.message}`, severity: 'error' });
    }
  }, [currentSale, saleId, navigate]);

  /**
   * 處理關閉 Snackbar
   */
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return {
    currentSale,
    barcode,
    inputModes,
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