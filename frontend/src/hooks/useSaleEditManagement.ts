import { useState, useEffect, useCallback, ChangeEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateSale } from '../services/salesServiceV2';
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
  productType?: string;
}

/**
 * 銷售資料介面
 */
interface SaleData {
  customer: string;
  items: SaleItem[];
  totalAmount: number;
  discount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other' | 'credit_card' | 'debit_card' | 'mobile_payment';
  paymentStatus: 'paid' | 'pending' | 'cancelled';
  note: string;
}

/**
 * Snackbar 狀態介面
 */
interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

/**
 * 輸入模式類型
 */
type InputMode = 'price' | 'subtotal';

/**
 * 銷售編輯管理 Hook
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
  const [inputModes, setInputModes] = useState<InputMode[]>([]); // 新增：輸入模式狀態
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (initialSaleData) {
      setCurrentSale(initialSaleData);
      // 初始化輸入模式，預設為單價模式
      setInputModes(new Array(initialSaleData.items.length).fill('price'));
    }
  }, [initialSaleData]);

  useEffect(() => {
    const total = currentSale.items.reduce((sum, item) => sum + (parseFloat(item.price.toString()) * item.quantity), 0);
    setCurrentSale(prev => ({
      ...prev,
      totalAmount: total - (parseFloat(prev.discount.toString()) || 0)
    }));
  }, [currentSale.items, currentSale.discount]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentSale(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleBarcodeChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  }, []);

  const handleBarcodeSubmit = useCallback(async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcode.trim()) {
      e.preventDefault();
      const trimmedBarcode = barcode.trim();
      setBarcode('');

      try {
        // 支援多種輸入方式：條碼、代碼、簡碼、健保碼
        let product = products.find(p =>
          String(p.code) === trimmedBarcode ||
          String(p.barcode) === trimmedBarcode ||
          String((p as any).shortCode) === trimmedBarcode ||
          String((p as any).healthInsuranceCode) === trimmedBarcode
        );

        if (product) {
          const existingItemIndex = currentSale.items.findIndex(item => item.product === product._id);
          let updatedItems: SaleItem[];

          if (existingItemIndex >= 0) {
            updatedItems = [...currentSale.items];
            updatedItems[existingItemIndex].quantity += 1;
            updatedItems[existingItemIndex].subtotal = updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
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

  const handleQuantityChange = useCallback((index: number, newQuantity: number | string) => {
    if (typeof newQuantity === 'string') {
      // 處理字串輸入（暫時允許空字串）
      const updatedItems = [...currentSale.items];
      updatedItems[index].quantity = newQuantity === '' ? 0 : parseInt(newQuantity);
      if (newQuantity !== '') {
        updatedItems[index].subtotal = updatedItems[index].price * updatedItems[index].quantity;
      }
      setCurrentSale(prev => ({ ...prev, items: updatedItems }));
      return;
    }
    
    if (newQuantity < 1) return;
    const updatedItems = [...currentSale.items];
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].subtotal = updatedItems[index].price * newQuantity;
    setCurrentSale(prev => ({ ...prev, items: updatedItems }));
  }, [currentSale.items]);

  const handlePriceChange = useCallback((index: number, newPriceStr: string) => {
    const updatedItems = [...currentSale.items];
    if (newPriceStr === '') {
        updatedItems[index].price = 0; 
        updatedItems[index].subtotal = 0;
    } else {
        const newPrice = parseFloat(newPriceStr);
        if (!isNaN(newPrice) && newPrice >= 0) {
            updatedItems[index].price = newPrice;
            updatedItems[index].subtotal = newPrice * updatedItems[index].quantity;
        } else {
            return; 
        }
    }
    setCurrentSale(prev => ({ ...prev, items: updatedItems }));
  }, [currentSale.items]);

  const handlePriceBlur = useCallback((index: number) => {
    const item = currentSale.items[index];
    if (item.price === 0 || isNaN(parseFloat(item.price.toString()))) {
        handlePriceChange(index, '0'); 
    }
  }, [currentSale.items, handlePriceChange]);

  // 新增：處理小計變更
  const handleSubtotalChange = useCallback((index: number, newSubtotal: number) => {
    if (newSubtotal < 0) return;
    const updatedItems = [...currentSale.items];
    updatedItems[index].subtotal = newSubtotal;
    if (updatedItems[index].quantity > 0) {
      updatedItems[index].price = newSubtotal / updatedItems[index].quantity;
    } else {
      updatedItems[index].price = 0;
    }
    setCurrentSale(prev => ({ ...prev, items: updatedItems }));
  }, [currentSale.items]);

  // 新增：切換輸入模式
  const toggleInputMode = useCallback((index: number) => {
    setInputModes(prevModes => {
      const updatedModes = [...prevModes];
      updatedModes[index] = updatedModes[index] === 'price' ? 'subtotal' : 'price';
      return updatedModes;
    });
  }, []);

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

  const handleUpdateSale = useCallback(async () => {
    if (currentSale.items.length === 0) {
      setSnackbar({ open: true, message: '請添加至少一個銷售項目', severity: 'error' });
      return;
    }

    const saleData = {
      customer: currentSale.customer ?? null,
      items: currentSale.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: parseFloat(item.price.toString()) ?? 0,
        subtotal: (parseFloat(item.price.toString()) ?? 0) * item.quantity
      })),
      totalAmount: currentSale.totalAmount,
      discount: parseFloat(currentSale.discount.toString()) ?? 0,
      paymentMethod: currentSale.paymentMethod,
      paymentStatus: currentSale.paymentStatus,
      note: currentSale.note,
    };

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

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return {
    currentSale,
    barcode,
    inputModes, // 新增：輸入模式
    handleBarcodeChange,
    handleBarcodeSubmit,
    handleInputChange,
    handleQuantityChange,
    handlePriceChange,
    handlePriceBlur,
    handleSubtotalChange, // 新增：小計變更處理
    toggleInputMode, // 新增：切換輸入模式
    handleRemoveItem,
    handleUpdateSale,
    snackbar,
    handleCloseSnackbar
  };
};