import { useState, useEffect, useCallback, ChangeEvent, useRef } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import { createSale } from '@/services/salesServiceV2';
import { Product } from '@pharmacy-pos/shared/types/entities';
import type { SaleCreateRequest } from '@/features/sale/api/dto';
import { Package } from '@pharmacy-pos/shared/types/package';
import type {
  PaymentMethod,
  PaymentStatus,
  SaleItem as SharedSaleItem,
} from '@pharmacy-pos/shared/schemas/zod/sale';
import { calculateSaleTotals } from '@/features/sale/utils/saleTotals';

/**
 * 銷售項目介面
 */
interface SaleLineItem extends SharedSaleItem {
  product: string;
  productDetails?: Product;
  name: string;
  code: string;
  price: number;
  quantity: number;
  subtotal: number;
  packageName?: string; // 套餐名稱（如果來自套餐）
}

/**
 * 銷售資料介面
 */
interface SaleData {
  saleNumber: string;
  customer: string;
  items: SaleLineItem[];
  totalAmount: number;
  grossAmount: number;
  discount: number;
  discountAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
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
  grossAmount: 0,
  discount: 0,
  discountAmount: 0,
  paymentMethod: 'cash',
  paymentStatus: 'paid',
  notes: '',
};

/**
 * Enhanced Custom Hook to manage the state and logic related to the current sale.
 * Includes callback support for post-save actions.
 * 
 * @param {Function} showSnackbar - Function to display snackbar messages.
 * @param {Function} onSaleCompleted - Optional callback function called after successful sale completion.
 * @returns {Object} - Contains current sale state, input modes, and handler functions.
 */
const useSaleManagementV2 = (
  showSnackbar: (message: string, severity?: 'success' | 'info' | 'warning' | 'error') => void,
  onSaleCompleted?: (saleData?: { totalAmount: number; saleNumber: string }) => void
) => {
  const [currentSale, setCurrentSale] = useState<SaleData>(initialSaleState);
  const [inputModes, setInputModes] = useState<InputMode[]>([]);
  const isProcessingProductRef = useRef<boolean>(false);
  const lastProcessedProductRef = useRef<string | null>(null);

  // Keep derived totals (gross, discount amount, net) in sync with items/discount input
  useEffect(() => {
    setCurrentSale(prev => {
      const { grossAmount, discountAmount, netAmount } = calculateSaleTotals(prev.items, prev.discount);
      if (
        prev.totalAmount === netAmount &&
        prev.grossAmount === grossAmount &&
        prev.discountAmount === discountAmount
      ) {
        return prev;
      }
      return {
        ...prev,
        totalAmount: netAmount,
        grossAmount,
        discountAmount,
      };
    });
  }, [currentSale.items, currentSale.discount]);

  // Handler for general sale info changes (customer, paymentMethod, note, discount, saleNumber)
  const handleSaleInfoChange = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | SelectChangeEvent<string>,
  ) => {
    const target = e.target as { name?: string; value: unknown };
    const fieldName = target?.name;
    if (!fieldName) {
      return;
    }

    setCurrentSale(prev => {
      if (fieldName === 'discount') {
        const parsed = typeof target.value === 'number'
          ? target.value
          : parseFloat(String(target.value));
        return {
          ...prev,
          discount: Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
        };
      }

      if (fieldName === 'paymentMethod') {
        return {
          ...prev,
          paymentMethod: String(target.value) as PaymentMethod,
        };
      }

      if (fieldName === 'paymentStatus') {
        return {
          ...prev,
          paymentStatus: String(target.value) as PaymentStatus,
        };
      }

      return {
        ...prev,
        [fieldName]: typeof target.value === 'string' ? target.value : String(target.value ?? ''),
      } as SaleData;
    });
  }, []);

  // Handler for adding a product to the sale
  const handleSelectProduct = useCallback((product: Product | null) => {
    if (!product) return;
    
    // 防重複調用檢查
    if (isProcessingProductRef.current) {
      console.log('handleSelectProduct blocked - already processing');
      return;
    }
    
    // 檢查是否是重複處理同一個產品
    const productKey = `${product._id}-${product.code}`;
    if (lastProcessedProductRef.current === productKey) {
      console.log('handleSelectProduct blocked - same product already processed:', productKey);
      return;
    }
    
    // 設置處理標誌
    isProcessingProductRef.current = true;
    lastProcessedProductRef.current = productKey;
    
    console.log('handleSelectProduct called with:', product.name, product._id);
    
    try {
      setCurrentSale(prevSale => {
        console.log('Current sale items before update:', prevSale.items.length);
        
        // 確保使用嚴格比較並檢查產品代碼以避免影響其他產品
        const existingItemIndex = prevSale.items.findIndex(item =>
          item.product === product._id && item.code === product.code
        );
        
        console.log('Existing item index:', existingItemIndex);
        
        let updatedItems;
        if (existingItemIndex >= 0) {
          // 只修改匹配的產品項目
          updatedItems = [...prevSale.items];
          const existingItem = updatedItems[existingItemIndex];
          if (existingItem) {
            existingItem.quantity += 1;
            existingItem.subtotal = existingItem.price * existingItem.quantity;
            showSnackbar(`已增加 ${product.name} 的數量`, 'success');
            console.log('Updated existing item quantity to:', existingItem.quantity);
          }
        } else {
          // 添加新項目，不影響其他項目
          const newItem: SaleLineItem = {
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
          console.log('Added new item:', newItem.name);
        }
        
        console.log('Final items count:', updatedItems.length);
        return { ...prevSale, items: updatedItems };
      });
    } finally {
      // 延遲重置處理標誌，防止立即重複調用
      const timeoutId: NodeJS.Timeout = setTimeout(() => {
        isProcessingProductRef.current = false;
        lastProcessedProductRef.current = null;
      }, 500);
      
      // 清理函數中清除timeout（雖然在這個情況下不太可能需要）
      return () => clearTimeout(timeoutId);
    }
  }, [showSnackbar]);

  // Handler for adding a package to the sale
  const handleSelectPackage = useCallback((packageItem: Package | null) => {
    if (!packageItem) return;
    
    setCurrentSale(prevSale => {
      // 將套餐展開為其包含的各個商品項目
      const newItems: SaleLineItem[] = [];
      const newModes: InputMode[] = [];
      
      if (packageItem.items && packageItem.items.length > 0) {
        for (const packageItemDetail of packageItem.items) {
          // 檢查是否已存在相同的商品
          const existingItemIndex = prevSale.items.findIndex(item =>
            item.product === packageItemDetail.productId &&
            item.name === packageItemDetail.productName
          );
          
          if (existingItemIndex >= 0) {
            // 如果商品已存在，增加數量
            const updatedItems = [...prevSale.items];
            const existingItem = updatedItems[existingItemIndex];
            if (existingItem) {
              existingItem.quantity += packageItemDetail.quantity;
              existingItem.subtotal = existingItem.price * existingItem.quantity;
              return { ...prevSale, items: updatedItems };
            }
          } else {
            // 創建新的銷售項目
            const newItem: SaleLineItem = {
              product: packageItemDetail.productId,
              name: packageItemDetail.productName,
              code: packageItemDetail.productCode || packageItem.code || '',
              price: packageItemDetail.unitPrice || (packageItemDetail.subtotal / packageItemDetail.quantity),
              quantity: packageItemDetail.quantity,
              subtotal: packageItemDetail.subtotal,
              packageName: packageItem.name // 單獨存儲套餐名稱
            };
            newItems.push(newItem);
            
            // 根據套餐項目的 priceMode 設置對應的輸入模式
            // 套餐中的 'unit' 對應銷售中的 'price'，'subtotal' 保持不變
            const inputMode: InputMode = packageItemDetail.priceMode === 'unit' ? 'price' : 'subtotal';
            newModes.push(inputMode);
          }
        }
        
        if (newItems.length > 0) {
          const updatedItems = [...prevSale.items, ...newItems];
          setInputModes(prevModes => [...prevModes, ...newModes]);
          showSnackbar(`已添加套餐 ${packageItem.name} 的 ${newItems.length} 個商品項目`, 'success');
          return { ...prevSale, items: updatedItems };
        }
      } else {
        // 如果套餐沒有詳細項目，則作為整體項目添加
        const existingItemIndex = prevSale.items.findIndex(item =>
          item.product === packageItem._id && item.code === packageItem.code
        );
        
        let updatedItems;
        if (existingItemIndex >= 0) {
          updatedItems = [...prevSale.items];
          const existingItem = updatedItems[existingItemIndex];
          if (existingItem) {
            existingItem.quantity += 1;
            existingItem.subtotal = existingItem.price * existingItem.quantity;
            showSnackbar(`已增加套餐 ${packageItem.name} 的數量`, 'success');
          }
        } else {
          const newItem: SaleLineItem = {
            product: packageItem._id || '',
            name: `[套餐] ${packageItem.name}`,
            code: packageItem.code,
            price: packageItem.totalPrice,
            quantity: 1,
            subtotal: packageItem.totalPrice
          };
          updatedItems = [...prevSale.items, newItem];
          setInputModes(prevModes => [...prevModes, 'price']);
          showSnackbar(`已添加套餐 ${packageItem.name}`, 'success');
        }
        return { ...prevSale, items: updatedItems };
      }
      
      return prevSale; // 如果沒有變更，返回原狀態
    });
  }, [showSnackbar]);

  // Handler for changing item quantity
  const handleQuantityChange = useCallback((index: number, newQuantity: number | string) => {
    const numQuantity = typeof newQuantity === 'string' ? parseInt(newQuantity, 10) : newQuantity;
    if (isNaN(numQuantity) || numQuantity < 1) return;
    setCurrentSale(prevSale => {
      const updatedItems = [...prevSale.items];
      const currentItem = updatedItems[index];
      if (currentItem) {
        currentItem.quantity = numQuantity;
        currentItem.subtotal = currentItem.price * numQuantity;
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
  const prepareSaleData = useCallback((finalSaleNumber: string): SaleCreateRequest => {
    const items = currentSale.items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
      ...(item.discount !== undefined ? { discount: item.discount } : {}),
      ...(item.unitPrice !== undefined ? { unitPrice: item.unitPrice } : {}),
      ...(item.notes !== undefined ? { notes: item.notes } : {}),
    }));

    const { grossAmount, discountAmount } = calculateSaleTotals(currentSale.items, currentSale.discount);

    const payload: SaleCreateRequest = {
      saleNumber: finalSaleNumber,
      items,
      totalAmount: grossAmount,
      paymentMethod: currentSale.paymentMethod,
      paymentStatus: currentSale.paymentStatus,
      ...(currentSale.discount > 0 ? { discount: currentSale.discount } : {}),
      ...(discountAmount > 0 ? { discountAmount } : {}),
      ...(currentSale.notes ? { notes: currentSale.notes } : {}),
    };

    if (currentSale.customer) {
      payload.customer = currentSale.customer;
    }

    return payload;
  }, [currentSale]);

  // 重置表單
  const resetForm = useCallback(() => {
    setCurrentSale(initialSaleState);
    setInputModes([]);
  }, []);

  // Handler for saving the sale with callback support
  const handleSaveSale = useCallback(async (): Promise<boolean> => {
    if (currentSale.items.length === 0) {
      showSnackbar('請添加至少一個銷售項目', 'error');
      return false;
    }

    try {
      const finalSaleNumber = currentSale.saleNumber || await generateSaleNumber();
      const saleData = prepareSaleData(finalSaleNumber);
      const { netAmount } = calculateSaleTotals(currentSale.items, currentSale.discount);

      await createSale(saleData);
      showSnackbar('銷售記錄已保存', 'success');
      resetForm();
      
      // Call the completion callback if provided
      if (onSaleCompleted) {
        onSaleCompleted({
          totalAmount: netAmount,
          saleNumber: finalSaleNumber
        });
      }
      
      return true;
    } catch (err: any) {
      console.error('保存銷售記錄失敗:', err);
      showSnackbar('保存銷售記錄失敗: ' + (err.response?.data?.msg ?? err.message), 'error');
      return false;
    }
  }, [currentSale, generateSaleNumber, prepareSaleData, resetForm, showSnackbar, onSaleCompleted]);

  return {
    currentSale,
    inputModes,
    handleSaleInfoChange,
    handleSelectProduct,
    handleSelectPackage,
    handleQuantityChange,
    handlePriceChange,
    handleSubtotalChange,
    handleRemoveItem,
    toggleInputMode,
    handleSaveSale,
    resetForm
  };
};

export default useSaleManagementV2;
