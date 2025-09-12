import { useState, useCallback, RefObject, ChangeEvent } from 'react';
import { productServiceV2 } from '../../../services/productServiceV2';
import { Product } from '@pharmacy-pos/shared/types/entities';
import { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';

/**
 * 當前項目介面
 */
interface CurrentItem {
  did: string; // 產品代碼
  dname: string;
  dquantity: string;
  dtotalCost: string;
  product: string | null | undefined; // 產品ID
  batchNumber?: string; // 批號
  packageQuantity?: string; // 大包裝數量
  boxQuantity?: string; // 盒裝數量
  packageUnits?: ProductPackageUnit[];
}

/**
 * 產品詳情映射介面
 */
interface ProductDetailsMap {
  [productCode: string]: Product & { stock: number };
}

/**
 * 表單數據介面
 */
interface FormData {
  soid: string;
  sobill: string;
  sobilldate: Date;
  sosupplier: string;
  supplier: string;
  items: CurrentItem[];
  notes: string;
  status: 'pending' | 'completed' | 'cancelled';
  paymentStatus: '未收' | '已收款' | '已開立';
  multiplierMode: string | number;
  [key: string]: any; // 允許其他屬性
}

/**
 * 出貨訂單項目 Hook 參數介面
 */
interface ShippingOrderItemsProps {
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
 * 出貨訂單項目 Hook 返回值介面
 */
interface ShippingOrderItemsResult {
  currentItem: CurrentItem;
  setCurrentItem: (item: CurrentItem | ((prev: CurrentItem) => CurrentItem)) => void;
  editingItemIndex: number;
  editingItem: CurrentItem | null;
  setEditingItem: (item: CurrentItem | null | ((prev: CurrentItem | null) => CurrentItem | null)) => void;
  handleItemInputChange: (e: { target: { name: string; value: string } }) => void;
  handleEditingItemChange: (e: { target: { name: string; value: string } }) => void;
  handleProductChange: (event: React.SyntheticEvent, newValue: Product | null) => void;
  handleAddItem: () => Promise<void>;
  handleRemoveItem: (index: number) => void;
  handleEditItem: (index: number) => void;
  handleSaveEditItem: () => Promise<void>;
  handleCancelEditItem: () => void;
  handleMoveItem: (index: number, direction: 'up' | 'down') => void;
  handleMainQuantityChange: (e: ChangeEvent<HTMLInputElement>, inputMode: 'base' | 'package', selectedProduct: Product | null) => number;
}

/**
 * 出貨訂單項目 Hook
 * 用於管理出貨訂單中的項目
 */
const useShippingOrderItems = ({
  showSnackbar,
  productInputRef,
  formData,
  setFormData,
  productDetails,
  setProductDetails,
  initialItems: _initialItems = [],
  productsData: _productsData = []
}: ShippingOrderItemsProps): ShippingOrderItemsResult => {
  const [currentItem, setCurrentItem] = useState<CurrentItem>({
    did: '', // 產品代碼
    dname: '',
    dquantity: '',
    dtotalCost: '',
    product: null, // 產品ID
    batchNumber: '', // 批號
    packageQuantity: '', // 大包裝數量
    boxQuantity: '', // 盒裝數量
    packageUnits: [] // 包裝單位數據
  });
  const [editingItemIndex, setEditingItemIndex] = useState<number>(-1);
  const [editingItem, setEditingItem] = useState<CurrentItem | null>(null);

  const handleItemInputChange = useCallback((e: { target: { name: string; value: string } }) => {
    setCurrentItem(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleEditingItemChange = useCallback((e: { target: { name: string; value: string } }) => {
    setEditingItem(prev => prev ? { ...prev, [e.target.name]: e.target.value } : null);
  }, []);

  const handleProductChange = useCallback((_event: React.SyntheticEvent, newValue: Product | null) => {
    if (newValue) {
      setCurrentItem(prev => ({
        ...prev,
        did: newValue.code, // 使用產品代碼作為 'did'
        dname: newValue.name,
        product: newValue._id, // 存儲實際的產品ID
        packageUnits: newValue.packageUnits || [] // 傳遞包裝單位數據
      }));
    } else {
      setCurrentItem(prev => ({
        ...prev,
        did: '',
        dname: '',
        product: null,
        batchNumber: '',
        packageQuantity: '',
        boxQuantity: '',
        packageUnits: []
      }));
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
        const detail = await productServiceV2.getProductByCode(newItem.did);
        if (detail) {
          setProductDetails(prev => ({ ...prev, [newItem.did]: { ...detail, stock: detail.stock || 0 } }));
        }
      } catch (_err: unknown) {
        console.error(`獲取產品 ${newItem.did} 詳細資料失敗:`, _err);
        showSnackbar(`無法獲取 ${newItem.dname} 的詳細資料`, 'warning');
      }
    }

    setCurrentItem({
      did: '',
      dname: '',
      dquantity: '',
      dtotalCost: '',
      product: null,
      batchNumber: '',
      packageQuantity: '',
      boxQuantity: '',
      packageUnits: []
    });
    if (productInputRef.current) {
        setTimeout(() => productInputRef.current?.focus(), 100);
    }
  }, [currentItem, formData.items, setFormData, showSnackbar, productInputRef, productDetails, setProductDetails]);

  const handleRemoveItem = useCallback((index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
  }, [formData.items, setFormData]);

  const handleEditItem = useCallback((index: number) => {
    const itemToEdit = formData.items[index];
    if (itemToEdit && itemToEdit.did && itemToEdit.dname && itemToEdit.dquantity !== undefined && itemToEdit.dtotalCost !== undefined) {
      setEditingItemIndex(index);
      setEditingItem({
        did: itemToEdit.did,
        dname: itemToEdit.dname,
        dquantity: itemToEdit.dquantity,
        dtotalCost: itemToEdit.dtotalCost,
        product: itemToEdit.product || null,
        batchNumber: itemToEdit.batchNumber || '',
        packageQuantity: itemToEdit.packageQuantity || '',
        boxQuantity: itemToEdit.boxQuantity || '',
        packageUnits: itemToEdit.packageUnits || []
      });
    }
  }, [formData.items]);

  const handleSaveEditItem = useCallback(async () => {
    if (!editingItem?.did || !editingItem?.dname || editingItem?.dquantity === undefined || editingItem?.dquantity === null || editingItem?.dquantity === '' || editingItem?.dtotalCost === '') {
      showSnackbar('請填寫完整的藥品項目資料', 'error');
      return;
    }
    const originalItem = formData.items[editingItemIndex];
    if (!originalItem || !editingItem) {
      showSnackbar('編輯項目資料不完整', 'error');
      return;
    }
    
    const newItems = [...formData.items];
    newItems[editingItemIndex] = editingItem;
    setFormData(prev => ({ ...prev, items: newItems }));

    if (originalItem.did !== editingItem.did && !productDetails[editingItem.did]) {
      try {
        const detail = await productServiceV2.getProductByCode(editingItem.did);
        if (detail) {
          setProductDetails(prev => ({ ...prev, [editingItem.did]: { ...detail, stock: detail.stock || 0 } }));
        }
      } catch (_err: unknown) {
        console.error(`獲取產品 ${editingItem.did} 詳細資料失敗:`, _err);
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
    const currentItem = newItems[index];
    const targetItem = newItems[targetIndex];
    
    if (currentItem && targetItem) {
      [newItems[index], newItems[targetIndex]] = [targetItem, currentItem];
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  }, [formData.items, setFormData]);

  // 處理主要數量輸入變更
  const handleMainQuantityChange = useCallback((e: ChangeEvent<HTMLInputElement>, inputMode: 'base' | 'package', selectedProduct: Product | null) => {
    const { value } = e.target;
    
    // 計算實際的總數量（基礎單位）
    let actualQuantity = 0;
    const numericValue = Number(value) || 0;
    
    if (inputMode === 'base' || !selectedProduct?.packageUnits?.length) {
      // 基礎單位模式，直接使用輸入的數量
      actualQuantity = numericValue;
      
      // 在基礎單位模式下，將 packageQuantity 和 boxQuantity 設置為空字符串
      handleItemInputChange({
        target: { name: 'packageQuantity', value: '' }
      });
      
      handleItemInputChange({
        target: { name: 'boxQuantity', value: '' }
      });
      
      // unit 屬性不再需要設置
    } else {
      // 大包裝單位模式，將輸入的數量乘以大包裝單位的數量
      const largestPackageUnit = [...(selectedProduct.packageUnits || [])]
        .sort((a, b) => b.unitValue - a.unitValue)[0];
      
      if (largestPackageUnit) {
        // 計算實際總數量（基礎單位）
        actualQuantity = numericValue * largestPackageUnit.unitValue;
        
        // 更新 packageQuantity 為輸入的大包裝數量
        handleItemInputChange({
          target: { name: 'packageQuantity', value: numericValue.toString() }
        });
        
        // 更新 boxQuantity 為每盒的數量（大包裝單位的值）
        handleItemInputChange({
          target: { name: 'boxQuantity', value: largestPackageUnit.unitValue.toString() }
        });
        
        // unit 屬性不再需要設置
      }
    }
    
    // 更新實際的總數量
    handleItemInputChange({
      target: { name: 'dquantity', value: actualQuantity.toString() }
    });
    
    // 返回計算出的實際總數量，以便 ItemForm 組件可以直接使用
    return actualQuantity;
  }, [handleItemInputChange]);

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
    handleMainQuantityChange,
  };
};

export default useShippingOrderItems;