import { useState, useEffect, useCallback } from 'react';
import { getLatestSaleNumber, createSale } from '../services/salesService';

const initialSaleState = {
  saleNumber: '',
  customer: '',
  items: [],
  totalAmount: 0,
  discount: 0,
  paymentMethod: 'cash',
  paymentStatus: 'paid',
  note: ''
};

/**
 * Custom Hook to manage the state and logic related to the current sale.
 * 
 * @param {Function} showSnackbar - Function to display snackbar messages.
 * @returns {Object} - Contains current sale state, input modes, and handler functions.
 */
const useSaleManagement = (showSnackbar) => {
  const [currentSale, setCurrentSale] = useState(initialSaleState);
  const [inputModes, setInputModes] = useState([]); // For SalesItemsTable price/subtotal toggle

  // Calculate Total Amount whenever items or discount change
  useEffect(() => {
    const total = currentSale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCurrentSale(prev => ({
      ...prev,
      totalAmount: total - prev.discount
    }));
  }, [currentSale.items, currentSale.discount]);

  // Handler for general sale info changes (customer, paymentMethod, note, discount, saleNumber)
  const handleSaleInfoChange = useCallback((e) => {
    const { name, value } = e.target;
    setCurrentSale(prev => ({
      ...prev,
      [name]: name === 'discount' ? parseFloat(value) || 0 : value
    }));
  }, []);

  // Handler for adding a product to the sale
  const handleSelectProduct = useCallback((product) => {
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
        updatedItems[existingItemIndex].quantity += 1;
        updatedItems[existingItemIndex].subtotal = updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
        showSnackbar(`已增加 ${product.name} 的數量`, 'success');
      } else {
        // 添加新項目，不影響其他項目
        const newItem = {
          product: product._id,
          productDetails: product, // Keep details for reference if needed
          name: product.name,
          code: product.code,
          price: product.sellingPrice || 0,
          quantity: 1,
          subtotal: product.sellingPrice || 0
        };
        updatedItems = [...prevSale.items, newItem];
        setInputModes(prevModes => [...prevModes, 'price']); // Add mode for new item
        showSnackbar(`已添加 ${product.name}`, 'success');
      }
      return { ...prevSale, items: updatedItems };
    });
  }, [showSnackbar]);

  // Handler for changing item quantity
  const handleQuantityChange = useCallback((index, newQuantity) => {
    if (newQuantity < 1) return;
    setCurrentSale(prevSale => {
      const updatedItems = [...prevSale.items];
      updatedItems[index].quantity = newQuantity;
      updatedItems[index].subtotal = updatedItems[index].price * newQuantity;
      return { ...prevSale, items: updatedItems };
    });
  }, []);

  // Handler for changing item price
  const handlePriceChange = useCallback((index, newPrice) => {
    if (newPrice < 0) return;
    setCurrentSale(prevSale => {
      const updatedItems = [...prevSale.items];
      updatedItems[index].price = newPrice;
      updatedItems[index].subtotal = newPrice * updatedItems[index].quantity;
      return { ...prevSale, items: updatedItems };
    });
  }, []);

  // Handler for changing item subtotal
  const handleSubtotalChange = useCallback((index, newSubtotal) => {
    if (newSubtotal < 0) return;
    setCurrentSale(prevSale => {
      const updatedItems = [...prevSale.items];
      updatedItems[index].subtotal = newSubtotal;
      if (updatedItems[index].quantity > 0) {
        updatedItems[index].price = newSubtotal / updatedItems[index].quantity;
      } else {
        updatedItems[index].price = 0;
      }
      return { ...prevSale, items: updatedItems };
    });
  }, []);

  // Handler for removing an item
  const handleRemoveItem = useCallback((index) => {
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
  const toggleInputMode = useCallback((index) => {
    setInputModes(prevModes => {
      const updatedModes = [...prevModes];
      updatedModes[index] = updatedModes[index] === 'price' ? 'subtotal' : 'price';
      return updatedModes;
    });
  }, []);

  // Handler for saving the sale
  const handleSaveSale = useCallback(async () => {
    if (currentSale.items.length === 0) {
      showSnackbar('請添加至少一個銷售項目', 'error');
      return false; // Indicate failure
    }
    try {
      let finalSaleNumber = currentSale.saleNumber;
      if (!finalSaleNumber) {
        const now = new Date();
        const datePrefix = `${now.getFullYear().toString()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        try {
          const latestNumber = await getLatestSaleNumber(datePrefix);
          const sequence = latestNumber ? parseInt(latestNumber.slice(-3)) + 1 : 1;
          finalSaleNumber = `${datePrefix}${sequence.toString().padStart(3, '0')}`;
        } catch (err) {
          console.error('獲取最新銷貨單號失敗:', err);
          finalSaleNumber = `${datePrefix}001`; // Fallback
          showSnackbar('自動生成銷貨單號失敗，使用備用號碼', 'warning');
        }
      }
      const saleData = {
        saleNumber: finalSaleNumber,
        customer: currentSale.customer || null,
        items: currentSale.items.map(item => ({ product: item.product, quantity: item.quantity, price: item.price, subtotal: item.subtotal })),
        totalAmount: currentSale.totalAmount,
        discount: currentSale.discount,
        paymentMethod: currentSale.paymentMethod,
        paymentStatus: currentSale.paymentStatus,
        note: currentSale.note,
      };
      await createSale(saleData);
      showSnackbar('銷售記錄已保存', 'success');
      // Reset form after successful save
      setCurrentSale(initialSaleState);
      setInputModes([]);
      return true; // Indicate success
    } catch (err) {
      console.error('保存銷售記錄失敗:', err);
      showSnackbar('保存銷售記錄失敗: ' + (err.response?.data?.msg || err.message), 'error');
      return false; // Indicate failure
    }
  }, [currentSale, showSnackbar]);

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

