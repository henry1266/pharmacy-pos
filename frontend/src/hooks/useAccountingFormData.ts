import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { format } from 'date-fns';
import { getAccountingCategories } from '../services/accountingCategoryService';
import { getUnaccountedSales, createAccountingRecord } from '../services/accountingService';
import { AccountingCategory } from '../types/entities';

/**
 * 頁面中使用的未結算銷售記錄介面
 */
export interface UnaccountedSale {
  _id?: string;
  lastUpdated: string;
  product?: {
    _id?: string;
    code?: string;
    name?: string;
  };
  quantity: number;
  totalAmount: number;
  saleNumber: string;
}

/**
 * 記帳項目介面
 */
interface AccountingItem {
  amount: number | string;
  category: string;
  categoryId: string;
  note: string;
  id?: string; // 添加可選的 id 屬性
}

/**
 * 記帳表單數據介面
 */
interface AccountingFormData {
  date: Date;
  shift: '' | 'morning' | 'afternoon' | 'evening';
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
      { amount: '', category: '', categoryId: '', note: '', id: `new-1` },
      { amount: '', category: '', categoryId: '', note: '', id: `new-2` }
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
      const data = await getAccountingCategories();
      setCategories(data);

      // Pre-fill first two items if categories exist
      if (data.length > 0) {
        setFormData(prevState => {
          const updatedItems = prevState.items.map((item, index) => {
            if (index < 2 && data[index] && !item.categoryId) { // Only pre-fill if not already set
              return {
                ...item,
                category: data[index].name,
                categoryId: data[index]._id
              };
            }
            return item;
          });
          return { ...prevState, items: updatedItems };
        });
      }
    } catch (err: any) {
      console.error('獲取記帳名目類別失敗 (hook):', err);
      setErrorCategories('獲取記帳名目類別失敗');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch unaccounted sales
  const fetchSales = useCallback(async (date: Date) => {
    if (!date) {
      setUnaccountedSales([]);
      return;
    }
    setLoadingSales(true);
    setSalesError(null);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const data = await getUnaccountedSales(formattedDate);
      
      // 將服務返回的數據轉換為頁面需要的格式
      const transformedData: UnaccountedSale[] = data.map(item => ({
        _id: item._id,
        saleNumber: item.saleNumber,
        lastUpdated: new Date(item.date).toISOString(),
        product: {
          _id: item.product._id,
          code: item.product.code,
          name: item.product.name
        },
        quantity: item.quantity,
        totalAmount: item.subtotal,
      }));
      
      setUnaccountedSales(transformedData);
    } catch (err: any) {
      console.error('獲取未標記銷售記錄失敗 (hook):', err);
      setSalesError(err.message ?? '獲取未標記銷售記錄失敗');
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
    setFormData(prevState => {
      const updatedItems = [...prevState.items];
      let newValue = value;

      // Handle '退押金' logic
      if (field === 'category' && value === '退押金') {
        const currentAmount = updatedItems[index].amount;
        if (typeof currentAmount === 'number' && currentAmount > 0) {
          updatedItems[index].amount = -Math.abs(currentAmount);
        }
      } else if (field === 'amount' && updatedItems[index].category === '退押金' && value !== '') {
        newValue = -Math.abs(parseFloat(value as string));
      } else if (field === 'amount') {
        newValue = value === '' ? '' : parseFloat(value as string);
      }

      updatedItems[index][field] = newValue as never; // Type assertion needed due to complex logic

      // Update categoryId when category name changes
      if (field === 'category' && categories.length > 0) {
        const selectedCategory = categories.find(cat => cat.name === value);
        updatedItems[index].categoryId = selectedCategory ? selectedCategory._id : '';
      }

      return { ...prevState, items: updatedItems };
    });
  }, [categories]);

  const handleAddItem = useCallback(() => {
    setFormData(prevState => ({
      ...prevState,
      items: [...prevState.items, { amount: '', category: '', categoryId: '', note: '', id: `new-${Date.now()}` }]
    }));
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setFormData(prevState => {
      const updatedItems = [...prevState.items];
      updatedItems.splice(index, 1);
      // Ensure at least one item row exists
      const finalItems = updatedItems.length ? updatedItems : [{ amount: '', category: '', categoryId: '', note: '', id: `new-${Date.now()}` }];
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
        item => item.amount !== '' && item.category !== '' && item.categoryId !== ''
      );

      if (validItems.length === 0) throw new Error('至少需要一個有效的項目 (金額和名目皆需填寫)');

      const submitData = {
        ...formData,
        date: formData.date, // Service will format
        items: validItems,
        shift: formData.shift as 'morning' | 'afternoon' | 'evening'
      };

      await createAccountingRecord(submitData);
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

  // Calculate total
  const calculateTotal = useCallback((items: AccountingItem[]) => {
    return items.reduce((sum, item) => sum + (parseFloat(item.amount as string) || 0), 0);
  }, []);

  const totalAmount = calculateTotal(formData.items);

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
    handleAddItem,
    handleRemoveItem,
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