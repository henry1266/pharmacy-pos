import { useState, useEffect, useCallback } from 'react';
import supplierService from '../services/supplierService';

/**
 * Custom hook for managing supplier data and operations.
 */
const useSupplierData = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch (err) {
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
  const selectSupplier = useCallback((id) => {
    const supplier = suppliers.find(s => s.id === id);
    setSelectedSupplier(supplier || null);
  }, [suppliers]);

  // Add supplier
  const addSupplier = useCallback(async (supplierData) => {
    try {
      await supplierService.createSupplier(supplierData);
      await fetchSuppliers(); // Re-fetch after adding
      return true; // Indicate success
    } catch (err) {
      console.error('新增供應商失敗 (hook):', err);
      setError(`新增供應商失敗: ${err.response?.data?.message || err.message}`);
      return false; // Indicate failure
    }
  }, [fetchSuppliers]);

  // Update supplier
  const updateSupplier = useCallback(async (id, supplierData) => {
    try {
      await supplierService.updateSupplier(id, supplierData);
      await fetchSuppliers(); // Re-fetch after updating
      // Update selected supplier if it was the one being edited
      if (selectedSupplier && selectedSupplier.id === id) {
        const updatedSelected = suppliers.find(s => s.id === id);
        setSelectedSupplier(updatedSelected || null);
      }
      return true; // Indicate success
    } catch (err) {
      console.error('更新供應商失敗 (hook):', err);
      setError(`更新供應商失敗: ${err.response?.data?.message || err.message}`);
      return false; // Indicate failure
    }
  }, [fetchSuppliers, selectedSupplier, suppliers]);

  // Delete supplier
  const deleteSupplier = useCallback(async (id) => {
    try {
      await supplierService.deleteSupplier(id);
      await fetchSuppliers(); // Re-fetch after deleting
      if (selectedSupplier && selectedSupplier.id === id) {
        setSelectedSupplier(null); // Clear selection if deleted
      }
      return true; // Indicate success
    } catch (err) {
      console.error('刪除供應商失敗 (hook):', err);
      setError(`刪除供應商失敗: ${err.response?.data?.message || err.message}`);
      return false; // Indicate failure
    }
  }, [fetchSuppliers, selectedSupplier]);

  // Import suppliers CSV
  const importCsv = useCallback(async (file) => {
    try {
      const result = await supplierService.importSuppliersCsv(file);
      if (result.success > 0) {
        await fetchSuppliers(); // Re-fetch if import was successful
      }
      return result; // Return the import result object
    } catch (err) {
      console.error('匯入供應商 CSV 失敗 (hook):', err);
      setError(`匯入 CSV 失敗: ${err.response?.data?.message || err.message}`);
      // Return a structured error result
      return { total: 0, success: 0, failed: 0, duplicates: 0, errors: [{ error: err.message }] };
    }
  }, [fetchSuppliers]);

  // Download template
  const downloadTemplate = useCallback(async () => {
    try {
      const blob = await supplierService.downloadSupplierTemplate();
      return blob;
    } catch (err) {
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

