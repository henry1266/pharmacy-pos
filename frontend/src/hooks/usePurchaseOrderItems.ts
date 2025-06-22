import { useState, useCallback, RefObject, ChangeEvent } from 'react';
import { getProductByCode } from '../services/productService';
import { Product } from '../../../shared/types/entities';

/**
 * 當前項目介面
 */
interface CurrentItem {
  did: string; // 產品代碼
  dname: string;
  dquantity: string;
  dtotalCost: string;
  product: string | null; // 產品ID
}

/**
 * 產品詳情映射介面
 */
interface ProductDetailsMap {
  [productCode: string]: Product;
}

/**
 * 表單數據介面
 */
interface FormData {
  items: CurrentItem[];
  [key: string]: any; // 允許其他屬性
}

/**
 * 採購訂單項目 Hook 參數介面
 */
interface PurchaseOrderItemsProps {
  showSnackbar: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
  productInputRef: RefObject<HTMLInputElement>;
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  productDetails: ProductDetailsMap;
  setProductDetails: (details: ProductDetailsMap | ((prev: ProductDetailsMap) => ProductDetailsMap)) => void;
  initialItems?: CurrentItem[];
  productsData?: Product[];
}

/**
 * 採購訂單項目 Hook 返回值介面
 */
interface PurchaseOrderItemsResult {
  currentItem: CurrentItem;
  setCurrentItem: (item: CurrentItem | ((prev: CurrentItem) => CurrentItem)) => void;
  editingItemIndex: number;
  editingItem: CurrentItem | null;
  setEditingItem: (item: CurrentItem | null | ((prev: CurrentItem | null) => CurrentItem | null)) => void;
  handleItemInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleEditingItemChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleProductChange: (event: React.SyntheticEvent, newValue: Product | null) => void;
  handleAddItem: () => Promise<void>;
  handleRemoveItem: (index: number) => void;
  handleEditItem: (index: number) => void;
  handleSaveEditItem: () => Promise<void>;
  handleCancelEditItem: () => void;
  handleMoveItem: (index: number, direction: 'up' | 'down') => void;
}

/**
 * 採購訂單項目 Hook
 * 用於管理採購訂單中的項目
 */
const usePurchaseOrderItems = ({
  showSnackbar,
  productInputRef,
  formData,
  setFormData,
  productDetails,
  setProductDetails,
  initialItems = [],
  productsData = []
}: PurchaseOrderItemsProps): PurchaseOrderItemsResult => {
  const [currentItem, setCurrentItem] = useState<CurrentItem>({
    did: '', // 產品代碼
    dname: '',
    dquantity: '',
    dtotalCost: '',
    product: null, // 產品ID
  });
  const [editingItemIndex, setEditingItemIndex] = useState<number>(-1);
  const [editingItem, setEditingItem] = useState<CurrentItem | null>(null);

  const handleItemInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setCurrentItem(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleEditingItemChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEditingItem(prev => prev ? { ...prev, [e.target.name]: e.target.value } : null);
  }, []);

  const handleProductChange = useCallback((event: React.SyntheticEvent, newValue: Product | null) => {
    if (newValue) {
      setCurrentItem(prev => ({
        ...prev,
        did: newValue.code, // 使用產品代碼作為 'did'
        dname: newValue.name,
        product: newValue._id, // 存儲實際的產品ID
      }));
    } else {
      setCurrentItem(prev => ({ ...prev, did: '', dname: '', product: null }));
    }
  }, []);

  const handleAddItem = useCallback(async () => {
    if (!currentItem.did || !currentItem.dname || currentItem.dquantity === undefined || currentItem.dquantity === null || currentItem.dquantity === '' || currentItem.dtotalCost === '') {
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
      } catch (err: any) {
        console.error(`獲取產品 ${newItem.did} 詳細資料失敗:`, err);
        showSnackbar(`無法獲取 ${newItem.dname} 的詳細資料`, 'warning');
      }
    }

    setCurrentItem({ did: '', dname: '', dquantity: '', dtotalCost: '', product: null });
    if (productInputRef.current) {
        setTimeout(() => productInputRef.current?.focus(), 100);
    }
  }, [currentItem, formData.items, setFormData, showSnackbar, productInputRef, productDetails, setProductDetails]);

  const handleRemoveItem = useCallback((index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
  }, [formData.items, setFormData]);

  const handleEditItem = useCallback((index: number) => {
    setEditingItemIndex(index);
    setEditingItem({ ...formData.items[index] });
  }, [formData.items]);

  const handleSaveEditItem = useCallback(async () => {
    if (!editingItem?.did || !editingItem?.dname || editingItem?.dquantity === undefined || editingItem?.dquantity === null || editingItem?.dquantity === '' || editingItem?.dtotalCost === '') {
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
      } catch (err: any) {
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

  const handleMoveItem = useCallback((index: number, direction: 'up' | 'down') => {
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
    setEditingItem, // 暴露以便在需要時直接操作，通常通過 handleEditItem
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