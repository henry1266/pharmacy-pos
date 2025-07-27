import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { format, isValid } from 'date-fns';
import { accountingServiceV2 } from '../services/accountingServiceV2';
import type {
  AccountingCategory,
  AccountingItem,
  UnaccountedSale
} from '@pharmacy-pos/shared/types/accounting';

/**
 * 記帳表單數據介面
 */
interface AccountingFormData {
  date: Date;
  shift: '' | '早' | '中' | '晚';
  status: 'pending' | 'completed' | 'cancelled';
  items: AccountingItem[];
}

/**
 * Custom hook for managing the accounting form data and related logic.
 */
const useAccountingFormData = () => {
  // Categories state
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<AccountingFormData>({
    date: new Date(),
    shift: '',
    status: 'pending',
    items: [
      { amount: 0, category: '', categoryId: '', note: '' },
      { amount: 0, category: '', categoryId: '', note: '' }
    ]
  });

  // Unaccounted sales state
  const [unaccountedSales, setUnaccountedSales] = useState<UnaccountedSale[]>([]);
  const [loadingSales, setLoadingSales] = useState<boolean>(false);
  const [salesError, setSalesError] = useState<string | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      setErrorCategories(null);
      const data = await accountingServiceV2.getAccountingCategories();
      setCategories(data);

      // Pre-fill first two items if categories exist
      if (data.length > 0) {
        setFormData(prevState => {
          const updatedItems = prevState.items.map((item, index) => {
            if (index < 2 && data[index] && !item.categoryId) { // Only pre-fill if not already set
              const categoryData = data[index];
              if (categoryData) {
                return {
                  ...item,
                  category: categoryData.name,
                  categoryId: categoryData._id
                };
              }
            }
            return item;
          });
          return { ...prevState, items: updatedItems };
        });
      }
    } catch (err: any) {
      console.error('獲取記帳名目類別失敗 (hook):', err);
      // 只有在不是認證錯誤時才設置錯誤訊息
      if (!err.message?.includes('沒有權限') && !err.message?.includes('Unauthorized')) {
        setErrorCategories('獲取記帳名目類別失敗');
      }
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch unaccounted sales
  const fetchSales = useCallback(async (date: Date) => {
    if (!date || !isValid(date)) {
      setUnaccountedSales([]);
      return;
    }
    setLoadingSales(true);
    setSalesError(null);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const data = await accountingServiceV2.getUnaccountedSales(formattedDate);
      
      // 將服務返回的數據轉換為頁面需要的格式
      const transformedData: UnaccountedSale[] = data.map((item: any) => ({
        _id: item._id,
        saleNumber: item.saleNumber,
        lastUpdated: item.lastUpdated ?? new Date().toISOString(),
        product: {
          _id: item.product?._id,
          code: item.product?.code,
          name: item.product?.name
        },
        quantity: item.quantity,
        totalAmount: item.totalAmount,
      }));
      
      setUnaccountedSales(transformedData);
    } catch (err: any) {
      console.error('獲取未標記銷售記錄失敗 (hook):', err);
      // 只有在不是認證錯誤時才設置錯誤訊息
      if (!err.message?.includes('沒有權限') && !err.message?.includes('Unauthorized')) {
        setSalesError(err.message ?? '獲取未標記銷售記錄失敗');
      }
      setUnaccountedSales([]);
    } finally {
      setLoadingSales(false);
    }
  }, []);

  useEffect(() => {
    fetchSales(formData.date);
  }, [formData.date, fetchSales]);

  // Form change handlers
  const handleFormChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  }, []);

  const handleDateChange = useCallback((date: Date) => {
    setFormData(prevState => ({
      ...prevState,
      date
    }));
  }, []);

  const handleItemChange = useCallback((index: number, field: keyof AccountingItem, value: string | number) => {
    // 對於金額欄位，不觸發狀態更新，避免失去焦點
    if (field === 'amount') {
      return; // 金額欄位只在 blur 時更新
    }

    setFormData(prevState => {
      const updatedItems = [...prevState.items];
      let newValue = value;

      // Handle '退押金' logic for category changes
      if (field === 'category' && value === '退押金') {
        const currentItem = updatedItems[index];
        if (currentItem) {
          const currentAmount = currentItem.amount;
          if (typeof currentAmount === 'number' && currentAmount > 0) {
            currentItem.amount = -Math.abs(currentAmount);
          }
        }
      }

      const currentItem = updatedItems[index];
      if (currentItem) {
        currentItem[field] = newValue as never; // Type assertion needed due to complex logic

        // Update categoryId when category name changes
        if (field === 'category' && categories.length > 0) {
          const selectedCategory = categories.find(cat => cat.name === value);
          currentItem.categoryId = selectedCategory ? selectedCategory._id : '';
        }
      }

      return { ...prevState, items: updatedItems };
    });
  }, [categories]);

  // 新增處理欄位失去焦點的函數
  const handleItemBlur = useCallback((index: number, field: keyof AccountingItem, value: string) => {
    if (field === 'amount') {
      setFormData(prevState => {
        const updatedItems = [...prevState.items];
        let numericValue = value === '' ? 0 : parseFloat(value) || 0;
        
        // Handle '退押金' logic for blur event
        const currentItem = updatedItems[index];
        if (currentItem) {
          if (currentItem.category === '退押金' && numericValue !== 0) {
            numericValue = -Math.abs(numericValue);
          }
          
          currentItem.amount = numericValue;
        }
        return { ...prevState, items: updatedItems };
      });
    }
  }, []);

  const handleAddItem = useCallback(() => {
    setFormData(prevState => ({
      ...prevState,
      items: [...prevState.items, { amount: 0, category: '', categoryId: '', note: '' }]
    }));
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setFormData(prevState => {
      const updatedItems = [...prevState.items];
      updatedItems.splice(index, 1);
      // Ensure at least one item row exists
      const finalItems = updatedItems.length ? updatedItems : [{ amount: 0, category: '', categoryId: '', note: '' }];
      return { ...prevState, items: finalItems };
    });
  }, []);

  // Submit handler
  const submitAccountingRecord = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      if (!formData.date) throw new Error('請選擇日期');
      if (!formData.shift) throw new Error('請選擇班別');

      const validItems = formData.items.filter(
        item => item.amount !== 0 && item.category !== '' && item.categoryId !== ''
      );

      if (validItems.length === 0) throw new Error('至少需要一個有效的項目 (金額和名目皆需填寫)');

      const submitData = {
        ...formData,
        date: formData.date, // Service will format
        items: validItems,
        shift: formData.shift as '早' | '中' | '晚'
      };

      await accountingServiceV2.createAccountingRecord(submitData);
      setSubmitSuccess(true);
      return true; // Indicate success
    } catch (err: any) {
      console.error('提交記帳記錄失敗 (hook):', err);
      setSubmitError(err.message ?? '提交記帳記錄失敗');
      return false; // Indicate failure
    } finally {
      setSubmitting(false);
    }
  }, [formData]);

  // Calculate totals - 分別計算進帳項目和監測產品
  const calculateAccountingTotal = useCallback((items: AccountingItem[]) => {
    return items.reduce((sum, item) => {
      const amount = typeof item.amount === 'number' ? item.amount : 0;
      return sum + amount;
    }, 0);
  }, []);

  const calculateMonitoredProductsTotal = useCallback((sales: UnaccountedSale[]) => {
    return sales.reduce((sum, sale) => {
      return sum + (sale.totalAmount || 0);
    }, 0);
  }, []);

  const accountingItemsTotal = calculateAccountingTotal(formData.items);
  const monitoredProductsTotal = calculateMonitoredProductsTotal(unaccountedSales);
  const totalAmount = accountingItemsTotal + monitoredProductsTotal;

  return {
    // Categories
    categories,
    loadingCategories,
    errorCategories,
    // Form Data
    formData,
    handleFormChange,
    handleDateChange,
    handleItemChange,
    handleItemBlur, // 新增 blur 處理函數
    handleAddItem,
    handleRemoveItem,
    // Totals - 分別提供三個數值
    accountingItemsTotal,
    monitoredProductsTotal,
    totalAmount,
    // Unaccounted Sales
    unaccountedSales,
    loadingSales,
    salesError,
    // Submission
    submitting,
    submitError,
    submitSuccess,
    submitAccountingRecord,
    setSubmitError, // Allow clearing submit error from component
    setSubmitSuccess // Allow resetting success state from component
  };
};

export default useAccountingFormData;