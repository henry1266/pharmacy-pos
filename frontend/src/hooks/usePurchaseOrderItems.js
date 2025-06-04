import { useState, useCallback } from 'react';
import { getProductByCode } from '../services/productService'; // Assuming this service exists

const usePurchaseOrderItems = ({
  showSnackbar,
  productInputRef,
  formData,
  setFormData,
  productDetails,
  setProductDetails,
  initialItems = [],
  productsData = []
}) => {
  const [currentItem, setCurrentItem] = useState({
    did: '', // product code
    dname: '',
    dquantity: '',
    dtotalCost: '',
    product: null, // product ID
  });
  const [editingItemIndex, setEditingItemIndex] = useState(-1);
  const [editingItem, setEditingItem] = useState(null);

  const handleItemInputChange = useCallback((e) => {
    setCurrentItem(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleEditingItemChange = useCallback((e) => {
    setEditingItem(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleProductChange = useCallback((event, newValue) => {
    if (newValue) {
      setCurrentItem(prev => ({
        ...prev,
        did: newValue.code, // Use product code for 'did'
        dname: newValue.name,
        product: newValue._id, // Store actual product ID
      }));
    } else {
      setCurrentItem(prev => ({ ...prev, did: '', dname: '', product: null }));
    }
  }, []);

  const handleAddItem = useCallback(async () => {
    if (!currentItem.did || !currentItem.dname || !currentItem.dquantity || currentItem.dtotalCost === '') {
      showSnackbar('請填寫完整的藥品項目資料', 'error');
      return;
    }
    const newItem = { ...currentItem };
    const newItems = [...formData.items, newItem];
    setFormData(prev => ({ ...prev, items: newItems }));

    if (!productDetails[newItem.did]) {
      try {
        const detail = await getProductByCode(newItem.did);
        if (detail) {
          setProductDetails(prev => ({ ...prev, [newItem.did]: detail }));
        }
      } catch (err) {
        console.error(`獲取產品 ${newItem.did} 詳細資料失敗:`, err);
        showSnackbar(`無法獲取 ${newItem.dname} 的詳細資料`, 'warning');
      }
    }

    setCurrentItem({ did: '', dname: '', dquantity: '', dtotalCost: '', product: null });
    if (productInputRef.current) {
        setTimeout(() => productInputRef.current.focus(), 100);
    }
  }, [currentItem, formData.items, setFormData, showSnackbar, productInputRef, productDetails, setProductDetails]);

  const handleRemoveItem = useCallback((index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
  }, [formData.items, setFormData]);

  const handleEditItem = useCallback((index) => {
    setEditingItemIndex(index);
    setEditingItem({ ...formData.items[index] });
  }, [formData.items]);

  const handleSaveEditItem = useCallback(async () => {
    if (!editingItem?.did || !editingItem?.dname || !editingItem?.dquantity || editingItem?.dtotalCost === '') {
      showSnackbar('請填寫完整的藥品項目資料', 'error');
      return;
    }
    const originalItem = formData.items[editingItemIndex];
    const newItems = [...formData.items];
    newItems[editingItemIndex] = editingItem;
    setFormData(prev => ({ ...prev, items: newItems }));

    if (originalItem.did !== editingItem.did && !productDetails[editingItem.did]) {
      try {
        const detail = await getProductByCode(editingItem.did);
        if (detail) {
          setProductDetails(prev => ({ ...prev, [editingItem.did]: detail }));
        }
      } catch (err) {
        console.error(`獲取產品 ${editingItem.did} 詳細資料失敗:`, err);
        showSnackbar(`無法獲取 ${editingItem.dname} 的詳細資料`, 'warning');
      }
    }

    setEditingItemIndex(-1);
    setEditingItem(null);
  }, [editingItem, formData.items, editingItemIndex, setFormData, showSnackbar, productDetails, setProductDetails]);

  const handleCancelEditItem = useCallback(() => {
    setEditingItemIndex(-1);
    setEditingItem(null);
  }, []);

  const handleMoveItem = useCallback((index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === formData.items.length - 1)) return;
    const newItems = [...formData.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setFormData(prev => ({ ...prev, items: newItems }));
  }, [formData.items, setFormData]);

  return {
    currentItem,
    setCurrentItem,
    editingItemIndex,
    editingItem,
    setEditingItem, // Expose for direct manipulation if needed, though usually through handleEditItem
    handleItemInputChange,
    handleEditingItemChange,
    handleProductChange,
    handleAddItem,
    handleRemoveItem,
    handleEditItem,
    handleSaveEditItem,
    handleCancelEditItem,
    handleMoveItem,
  };
};

export default usePurchaseOrderItems;
