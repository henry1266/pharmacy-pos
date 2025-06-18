import { useState, useEffect, useCallback } from 'react';
import supplierService from '../services/supplierService';
import { Supplier } from '../types/entities';

/**
 * 供應商導入結果介面
 */
interface ImportResult {
  total: number;
  success: number;
  failed: number;
  duplicates: number;
  errors: Array<{ error: string }>;
}

/**
 * 供應商服務返回結果介面
 */
interface SupplierServiceResult {
  success: boolean;
  message?: string;
  imported?: number;
  errors?: any[];
  total?: number;
  failed?: number;
  duplicates?: number;
}

/**
 * Custom hook for managing supplier data and operations.
 */
const useSupplierData = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Fetch suppliers
  const fetchSuppliers = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch (err: any) {
      console.error('獲取供應商數據失敗 (hook):', err);
      setError(`獲取供應商數據失敗: ${err.message}`);
      setSuppliers([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Select supplier
  const selectSupplier = useCallback((id: string): void => {
    const supplier = suppliers.find(s => s._id === id || (s as any).id === id);
    setSelectedSupplier(supplier || null);
  }, [suppliers]);

  // Add supplier
  const addSupplier = useCallback(async (supplierData: Partial<Supplier>): Promise<boolean> => {
    try {
      await supplierService.createSupplier(supplierData);
      await fetchSuppliers(); // Re-fetch after adding
      return true; // Indicate success
    } catch (err: any) {
      console.error('新增供應商失敗 (hook):', err);
      setError(`新增供應商失敗: ${err.response?.data?.message || err.message}`);
      return false; // Indicate failure
    }
  }, [fetchSuppliers]);

  // Update supplier
  const updateSupplier = useCallback(async (id: string, supplierData: Partial<Supplier>): Promise<boolean> => {
    try {
      await supplierService.updateSupplier(id, supplierData);
      await fetchSuppliers(); // Re-fetch after updating
      // Update selected supplier if it was the one being edited
      if (selectedSupplier && (selectedSupplier._id === id || (selectedSupplier as any).id === id)) {
        const updatedSelected = suppliers.find(s => s._id === id || (s as any).id === id);
        setSelectedSupplier(updatedSelected || null);
      }
      return true; // Indicate success
    } catch (err: any) {
      console.error('更新供應商失敗 (hook):', err);
      setError(`更新供應商失敗: ${err.response?.data?.message || err.message}`);
      return false; // Indicate failure
    }
  }, [fetchSuppliers, selectedSupplier, suppliers]);

  // Delete supplier
  const deleteSupplier = useCallback(async (id: string): Promise<boolean> => {
    try {
      await supplierService.deleteSupplier(id);
      await fetchSuppliers(); // Re-fetch after deleting
      if (selectedSupplier && (selectedSupplier._id === id || (selectedSupplier as any).id === id)) {
        setSelectedSupplier(null); // Clear selection if deleted
      }
      return true; // Indicate success
    } catch (err: any) {
      console.error('刪除供應商失敗 (hook):', err);
      setError(`刪除供應商失敗: ${err.response?.data?.message || err.message}`);
      return false; // Indicate failure
    }
  }, [fetchSuppliers, selectedSupplier]);

  // Import suppliers CSV
  const importCsv = useCallback(async (file: File): Promise<ImportResult> => {
    try {
      const result = await supplierService.importSuppliersCsv(file) as SupplierServiceResult;
      if (result.success) {
        await fetchSuppliers(); // Re-fetch if import was successful
      }
      
      // 將服務返回結果轉換為 ImportResult 格式
      return {
        total: result.total || 0,
        success: result.imported || 0,
        failed: result.failed || 0,
        duplicates: result.duplicates || 0,
        errors: result.errors?.map(err => ({ error: typeof err === 'string' ? err : JSON.stringify(err) })) || []
      };
    } catch (err: any) {
      console.error('匯入供應商 CSV 失敗 (hook):', err);
      setError(`匯入 CSV 失敗: ${err.response?.data?.message || err.message}`);
      // Return a structured error result
      return { total: 0, success: 0, failed: 0, duplicates: 0, errors: [{ error: err.message }] };
    }
  }, [fetchSuppliers]);

  // Download template
  const downloadTemplate = useCallback(async (): Promise<Blob | null> => {
    try {
      const blob = await supplierService.downloadSupplierTemplate();
      return blob;
    } catch (err: any) {
      console.error('下載模板失敗 (hook):', err);
      setError(`下載模板失敗: ${err.message}`);
      return null;
    }
  }, []);

  return {
    suppliers,
    loading,
    error,
    selectedSupplier,
    fetchSuppliers,
    selectSupplier,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    importCsv,
    downloadTemplate,
    setError // Expose setError to allow clearing errors from the component if needed
  };
};

export default useSupplierData;