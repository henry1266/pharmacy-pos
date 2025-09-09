import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { createSale } from '../services/salesServiceV2';
import { Product } from '@pharmacy-pos/shared/types/entities';

/**
 * 銷售項目介面
 */
interface SaleItem {
  product: string;
  productDetails?: Product;
  name: string;
  code: string;
  price: number;
  quantity: number;
  subtotal: number;
}

/**
 * 銷售資料介面
 */
interface SaleData {
  saleNumber: string;
  customer: string;
  items: SaleItem[];
  totalAmount: number;
  discount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  paymentStatus: 'paid' | 'pending' | 'cancelled';
  notes: string;
}

/**
 * 輸入模式類型
 */
type InputMode = 'price' | 'subtotal';

const initialSaleState: SaleData = {
  saleNumber: '',
  customer: '',
  items: [],
  totalAmount: 0,
  discount: 0,
  paymentMethod: 'cash',
  paymentStatus: 'paid',
  notes: ''
};

/**
 * Custom Hook to manage the state and logic related to the current sale.
 * 
 * @param {Function} showSnackbar - Function to display snackbar messages.
 * @returns {Object} - Contains current sale state, input modes, and handler functions.
 */
const useSaleManagement = (showSnackbar: (message: string, severity: string) => void) => {
  const [currentSale, setCurrentSale] = useState<SaleData>(initialSaleState);
  const [inputModes, setInputModes] = useState<InputMode[]>([]); // For SalesItemsTable price/subtotal toggle

  // Calculate Total Amount whenever items or discount change
  useEffect(() => {
    const total = currentSale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCurrentSale(prev => ({
      ...prev,
      totalAmount: total - prev.discount
    }));
  }, [currentSale.items, currentSale.discount]);

  // Handler for general sale info changes (customer, paymentMethod, note, discount, saleNumber)
  const handleSaleInfoChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentSale(prev => ({
      ...prev,
      [name]: name === 'discount' ? parseFloat(value) || 0 : value
    }));
  }, []);

  // Handler for adding a product to the sale
  const handleSelectProduct = useCallback((product: Product | null) => {
    if (!product) return;
    setCurrentSale(prevSale => {
      // 確保使用嚴格比較並檢查產品代碼以避免影響其他產品
      const existingItemIndex = prevSale.items.findIndex(item =>
        item.product === product._id && item.code === product.code
      );
      
      let updatedItems;
      if (existingItemIndex >= 0) {
        // 只修改匹配的產品項目
        updatedItems = [...prevSale.items];
        const existingItem = updatedItems[existingItemIndex];
        if (existingItem) {
          existingItem.quantity += 1;
          existingItem.subtotal = existingItem.price * existingItem.quantity;
          showSnackbar(`已增加 ${product.name} 的數量`, 'success');
        }
      } else {
        // 添加新項目，不影響其他項目
        const newItem: SaleItem = {
          product: product._id,
          productDetails: product, // Keep details for reference if needed
          name: product.name,
          code: product.code,
          price: product.sellingPrice ?? product.price ?? 0,
          quantity: 1,
          subtotal: product.sellingPrice ?? product.price ?? 0
        };
        updatedItems = [...prevSale.items, newItem];
        setInputModes(prevModes => [...prevModes, 'price']); // Add mode for new item
        showSnackbar(`已添加 ${product.name}`, 'success');
      }
      return { ...prevSale, items: updatedItems };
    });
  }, [showSnackbar]);

  // Handler for changing item quantity
  const handleQuantityChange = useCallback((index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCurrentSale(prevSale => {
      const updatedItems = [...prevSale.items];
      const currentItem = updatedItems[index];
      if (currentItem) {
        currentItem.quantity = newQuantity;
        currentItem.subtotal = currentItem.price * newQuantity;
      }
      return { ...prevSale, items: updatedItems };
    });
  }, []);

  // Handler for changing item price
  const handlePriceChange = useCallback((index: number, newPrice: number) => {
    if (newPrice < 0) return;
    setCurrentSale(prevSale => {
      const updatedItems = [...prevSale.items];
      const currentItem = updatedItems[index];
      if (currentItem) {
        currentItem.price = newPrice;
        currentItem.subtotal = newPrice * currentItem.quantity;
      }
      return { ...prevSale, items: updatedItems };
    });
  }, []);

  // Handler for changing item subtotal
  const handleSubtotalChange = useCallback((index: number, newSubtotal: number) => {
    if (newSubtotal < 0) return;
    setCurrentSale(prevSale => {
      const updatedItems = [...prevSale.items];
      const currentItem = updatedItems[index];
      if (currentItem) {
        currentItem.subtotal = newSubtotal;
        if (currentItem.quantity > 0) {
          currentItem.price = newSubtotal / currentItem.quantity;
        } else {
          currentItem.price = 0;
        }
      }
      return { ...prevSale, items: updatedItems };
    });
  }, []);

  // Handler for removing an item
  const handleRemoveItem = useCallback((index: number) => {
    setCurrentSale(prevSale => {
      const updatedItems = [...prevSale.items];
      updatedItems.splice(index, 1);
      setInputModes(prevModes => {
        const updatedModes = [...prevModes];
        updatedModes.splice(index, 1);
        return updatedModes;
      });
      return { ...prevSale, items: updatedItems };
    });
  }, []);

  // Handler for toggling input mode (price/subtotal)
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

  // 生成銷貨單號
  const generateSaleNumber = useCallback(async (): Promise<string> => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const datePrefix = `${now.getFullYear().toString()}${month < 10 ? '0' + month : month.toString()}${date < 10 ? '0' + date : date.toString()}`;
    
    try {
      // 暫時使用簡單的時間戳生成，後續可以實現 getLatestSaleNumber 功能
      const timestamp = Date.now().toString().slice(-3);
      return `${datePrefix}${timestamp}`;
    } catch (err) {
      console.error('生成銷貨單號失敗:', err);
      showSnackbar('自動生成銷貨單號失敗，使用備用號碼', 'warning');
      return `${datePrefix}001`; // Fallback
    }
  }, [showSnackbar]);

  // 準備銷售數據
  const prepareSaleData = useCallback((finalSaleNumber: string) => {
    return {
      saleNumber: finalSaleNumber,
      customer: currentSale.customer ?? null,
      items: currentSale.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })),
      totalAmount: currentSale.totalAmount,
      discount: currentSale.discount,
      paymentMethod: currentSale.paymentMethod,
      paymentStatus: currentSale.paymentStatus,
      notes: currentSale.notes,
    };
  }, [currentSale]);

  // 重置表單
  const resetForm = useCallback(() => {
    setCurrentSale(initialSaleState);
    setInputModes([]);
  }, []);

  // Handler for saving the sale
  const handleSaveSale = useCallback(async (): Promise<boolean> => {
    if (currentSale.items.length === 0) {
      showSnackbar('請添加至少一個銷售項目', 'error');
      return false;
    }

    try {
      const finalSaleNumber = currentSale.saleNumber ?? await generateSaleNumber();
      const saleData = prepareSaleData(finalSaleNumber);
      
      await createSale(saleData);
      showSnackbar('銷售記錄已保存', 'success');
      resetForm();
      return true;
    } catch (err: any) {
      console.error('保存銷售記錄失敗:', err);
      showSnackbar('保存銷售記錄失敗: ' + (err.response?.data?.msg ?? err.message), 'error');
      return false;
    }
  }, [currentSale, generateSaleNumber, prepareSaleData, resetForm, showSnackbar]);

  return {
    currentSale,
    inputModes,
    handleSaleInfoChange,
    handleSelectProduct,
    handleQuantityChange,
    handlePriceChange,
    handleSubtotalChange,
    handleRemoveItem,
    toggleInputMode,
    handleSaveSale
  };
};

export default useSaleManagement;