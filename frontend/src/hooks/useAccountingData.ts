import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { accountingServiceV2 } from '../services/accountingServiceV2';
import type {
  ExtendedAccountingRecord,
  FormData,
  OperationResult,
  AccountingFilters
} from '@pharmacy-pos/shared/types/accounting';

/**
 * Custom Hook for managing Accounting Page data and logic.
 * Fetches accounting records, handles filtering, deletion, and fetching data for editing.
 */
const useAccountingData = () => {
  const [records, setRecords] = useState<ExtendedAccountingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filterShift, setFilterShift] = useState<'morning' | 'afternoon' | 'evening' | '早' | '中' | '晚' | ''>('');
  const [searchText, setSearchText] = useState<string>(''); // 新增搜尋文字狀態

  // Fetch records based on filters
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: AccountingFilters = {};
      if (startDate) {
        filters.startDate = startDate;
      }
      if (endDate) {
        filters.endDate = endDate;
      }
      if (filterShift) {
        (filters as any).shift = filterShift;
      }
      if (searchText && searchText.trim()) {
        (filters as any).search = searchText.trim(); // 新增搜尋參數，使用類型斷言
      }
      
      const records = await accountingServiceV2.getAccountingRecords(filters);
      setRecords(records);
    } catch (err: any) {
      console.error('載入記帳記錄失敗 (hook):', err);
      setError(err.message || '載入記帳記錄失敗');
      setRecords([]); // Clear records on error
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, filterShift, searchText]); // 新增 searchText 依賴

  // Initial fetch and fetch on filter change
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Delete record
  const deleteRecord = useCallback(async (id: string): Promise<OperationResult> => {
    // Note: Confirmation logic should remain in the component
    try {
      await accountingServiceV2.deleteAccountingRecord(id);
      // Optimistic update or refetch
      setRecords(prev => prev.filter(record => record._id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('刪除記帳記錄失敗 (hook):', err);
      return { success: false, error: err.message || '刪除記帳記錄失敗' };
    }
  }, []);

  // Fetch data needed for editing a record
  const fetchEditData = useCallback(async (record: ExtendedAccountingRecord): Promise<OperationResult> => {
    try {
      let unaccountedSales: any[] = [];
      let manualItems = record.items ? record.items.filter(item => item.category !== "其他自費") : [];

      if (record.status === 'pending') {
        // Fetch current unaccounted sales only if status is pending
        unaccountedSales = await accountingServiceV2.getUnaccountedSales(format(new Date(record.date), 'yyyy-MM-dd'));
      }

      const editFormData: FormData = {
        date: new Date(record.date),
        shift: record.shift as string,
        status: record.status ?? 'pending',
        items: record.status === 'pending' ? manualItems : (record.items ?? []),
        unaccountedSales: unaccountedSales
      };
      return { success: true, data: editFormData };

    } catch (err: any) {
      console.error('獲取編輯資料失敗 (hook):', err);
      return { success: false, error: '載入編輯資料失敗，無法獲取未結算銷售' };
    }
  }, []);

  return {
    // Data
    records,
    // Loading State
    loading,
    // Error State
    error,
    // Filter State & Setters
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filterShift,
    setFilterShift,
    searchText, // 新增搜尋文字狀態
    setSearchText, // 新增搜尋文字設定函數
    // Actions
    fetchRecords, // Expose refetch capability
    deleteRecord,
    fetchEditData,
  };
};

export default useAccountingData;