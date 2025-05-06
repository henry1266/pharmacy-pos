import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as salesService from '../services/salesService'; // Ensure this path is correct

export const useSaleEditManagement = (initialSaleData, products, saleId) => {
  const navigate = useNavigate();
  const [currentSale, setCurrentSale] = useState({
    customer: '',
    items: [],
    totalAmount: 0,
    discount: 0,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    note: ''
  });
  const [barcode, setBarcode] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (initialSaleData) {
      setCurrentSale(initialSaleData);
    }
  }, [initialSaleData]);

  useEffect(() => {
    const total = currentSale.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    setCurrentSale(prev => ({
      ...prev,
      totalAmount: total - (parseFloat(prev.discount) || 0)
    }));
  }, [currentSale.items, currentSale.discount]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setCurrentSale(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleBarcodeChange = useCallback((e) => {
    setBarcode(e.target.value);
  }, []);

  const handleBarcodeSubmit = useCallback(async (e) => {
    if (e.key === 'Enter' && barcode.trim()) {
      e.preventDefault();
      const trimmedBarcode = barcode.trim();
      setBarcode('');

      try {
        let product = products.find(p => p.code === trimmedBarcode);
        if (!product) {
          product = products.find(p => 
            p.productType === 'medicine' && 
            p.healthInsuranceCode === trimmedBarcode
          );
        }

        if (product) {
          const existingItemIndex = currentSale.items.findIndex(item => item.product === product._id);
          let updatedItems;

          if (existingItemIndex >= 0) {
            updatedItems = [...currentSale.items];
            updatedItems[existingItemIndex].quantity += 1;
            updatedItems[existingItemIndex].subtotal = updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
            setSnackbar({ open: true, message: `已增加 ${product.name} 的數量`, severity: 'success' });
          } else {
            const newItem = {
              product: product._id,
              productDetails: product,
              name: product.name,
              code: product.code,
              price: product.sellingPrice,
              quantity: 1,
              subtotal: product.sellingPrice,
              productType: product.productType
            };
            updatedItems = [...currentSale.items, newItem];
            setSnackbar({ open: true, message: `已添加 ${product.name}`, severity: 'success' });
          }
          setCurrentSale(prev => ({ ...prev, items: updatedItems }));
        } else {
          setSnackbar({ open: true, message: `找不到條碼或健保碼 ${trimmedBarcode} 對應的產品`, severity: 'error' });
        }
      } catch (err) {
        console.error('處理條碼失敗:', err);
        setSnackbar({ open: true, message: '處理條碼失敗', severity: 'error' });
      }
    }
  }, [barcode, products, currentSale.items]);

  const handleQuantityChange = useCallback((index, newQuantity) => {
    if (newQuantity < 1) return;
    const updatedItems = [...currentSale.items];
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].subtotal = updatedItems[index].price * newQuantity;
    setCurrentSale(prev => ({ ...prev, items: updatedItems }));
  }, [currentSale.items]);

  const handlePriceChange = useCallback((index, newPriceStr) => {
    const updatedItems = [...currentSale.items];
    if (newPriceStr === '') {
        updatedItems[index].price = ''; 
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

  const handlePriceBlur = useCallback((index) => {
    const item = currentSale.items[index];
    if (item.price === '' || isNaN(parseFloat(item.price))) {
        handlePriceChange(index, '0'); 
    }
  }, [currentSale.items, handlePriceChange]);

  const handleRemoveItem = useCallback((index) => {
    const updatedItems = [...currentSale.items];
    updatedItems.splice(index, 1);
    setCurrentSale(prev => ({ ...prev, items: updatedItems }));
  }, [currentSale.items]);

  const handleUpdateSale = useCallback(async () => {
    if (currentSale.items.length === 0) {
      setSnackbar({ open: true, message: '請添加至少一個銷售項目', severity: 'error' });
      return;
    }

    const saleData = {
      customer: currentSale.customer || null,
      items: currentSale.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: parseFloat(item.price) || 0,
        subtotal: (parseFloat(item.price) || 0) * item.quantity
      })),
      totalAmount: currentSale.totalAmount,
      discount: parseFloat(currentSale.discount) || 0,
      paymentMethod: currentSale.paymentMethod,
      paymentStatus: currentSale.paymentStatus,
      note: currentSale.note,
    };

    try {
      // Corrected: Ensure salesService.updateSale is correctly called
      await salesService.updateSale(saleId, saleData);
      setSnackbar({ open: true, message: '銷售記錄已更新', severity: 'success' });
      setTimeout(() => navigate('/sales'), 1500);
    } catch (err) {
      console.error('更新銷售記錄失敗:', err);
      setSnackbar({ open: true, message: `更新銷售記錄失敗: ${err.response?.data?.msg || err.message}`, severity: 'error' });
    }
  }, [currentSale, saleId, navigate]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return {
    currentSale,
    barcode,
    handleBarcodeChange,
    handleBarcodeSubmit,
    handleInputChange,
    handleQuantityChange,
    handlePriceChange,
    handlePriceBlur,
    handleRemoveItem,
    handleUpdateSale,
    snackbar,
    handleCloseSnackbar
  };
};
